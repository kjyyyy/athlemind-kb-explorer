import { NextResponse } from "next/server";
import { z } from "zod";

import { KbUpstreamError, kbFetch } from "@/lib/kb-proxy";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const IdSchema = z.string().uuid();

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(clientIp(req), { scope: "chat-poll", max: 120 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }
  const { id } = await ctx.params;
  if (!IdSchema.safeParse(id).success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    const res = await kbFetch(`/v1/evidence/jobs/${id}`);
    if (res.status === 404) {
      return NextResponse.json({ error: "job_lost" }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: "upstream_error" }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (e) {
    if (e instanceof KbUpstreamError && e.warming) {
      return NextResponse.json({ error: "warming" }, { status: 503 });
    }
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
