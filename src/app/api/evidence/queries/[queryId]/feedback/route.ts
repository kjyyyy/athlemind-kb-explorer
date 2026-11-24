import { NextResponse } from "next/server";
import { z } from "zod";

import { KbUpstreamError, kbFetch } from "@/lib/kb-proxy";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const BodySchema = z.object({
  rating: z.enum(["up", "down"]),
  comment: z.string().max(500).optional(),
  session_id: z.string().max(64).optional(),
});

type RouteCtx = { params: Promise<{ queryId: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  const ip = clientIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }
  const { queryId } = await ctx.params;
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    const res = await kbFetch(`/v1/evidence/queries/${encodeURIComponent(queryId)}/feedback`, {
      method: "POST",
      body: JSON.stringify({
        rating: body.rating,
        comment: body.comment,
        client: "explorer",
        session_id: body.session_id,
      }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { detail?: string } | null;
      const status = res.status === 404 ? 404 : res.status;
      return NextResponse.json({ error: err?.detail ?? "upstream_error" }, { status });
    }
    return NextResponse.json(await res.json());
  } catch (e) {
    if (e instanceof KbUpstreamError && e.warming) {
      return NextResponse.json({ error: "warming" }, { status: 503 });
    }
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}