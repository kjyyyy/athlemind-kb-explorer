import { NextResponse } from "next/server";
import { z } from "zod";

import { KbUpstreamError, kbFetch } from "@/lib/kb-proxy";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const QuerySchema = z.object({
  q: z.string().max(200).default(""),
  limit: z.coerce.number().int().min(1).max(25).optional(),
});

export async function GET(req: Request) {
  const rl = rateLimit(clientIp(req), { scope: "typeahead", max: 120 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }
  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const params = new URLSearchParams({ q: parsed.data.q, limit: String(parsed.data.limit ?? 10) });
  try {
    const res = await kbFetch(`/v1/works/search?${params}`);
    if (!res.ok) {
      return NextResponse.json({ error: "upstream_error" }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (e) {
    if (e instanceof KbUpstreamError && e.warming) {
      return NextResponse.json({ results: [], warming: true });
    }
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
