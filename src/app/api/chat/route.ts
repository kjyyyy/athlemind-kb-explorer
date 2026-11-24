import { NextResponse } from "next/server";
import { z } from "zod";

import { KbUpstreamError, kbFetch } from "@/lib/kb-proxy";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(8).optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const res = await kbFetch("/v1/evidence", {
      method: "POST",
      body: JSON.stringify({
        query: body.query,
        limit: body.limit ?? 8,
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof KbUpstreamError && e.warming) {
      return NextResponse.json({
        query: body.query,
        answer:
          "The knowledge base is warming up (loading models). Please try again in a minute.",
        sources: [],
        warming: true,
      });
    }
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}