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
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    const res = await kbFetch("/v1/evidence/jobs", {
      method: "POST",
      body: JSON.stringify({ query: body.query, limit: body.limit ?? 8 }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream_error" }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (e) {
    if (e instanceof KbUpstreamError && e.warming) {
      return NextResponse.json({ error: "warming" }, { status: 503 });
    }
    if (e instanceof KbUpstreamError && e.status === 504) {
      return NextResponse.json({ error: "timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
