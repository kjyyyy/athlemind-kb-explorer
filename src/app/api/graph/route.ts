import { NextResponse } from "next/server";
import { z } from "zod";

import { KbUpstreamError, kbFetch } from "@/lib/kb-proxy";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const QuerySchema = z.object({
  mode: z.enum(["overview", "neighbourhood", "entities"]).default("overview"),
  topic: z.string().max(120).optional(),
  work_id: z.string().uuid().optional(),
  depth: z.coerce.number().int().min(1).max(2).optional(),
  q: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(5).max(100).optional(),
});

export async function GET(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const q = parsed.data;
  let path = "/v1/graph/overview";
  const params = new URLSearchParams();
  if (q.mode === "neighbourhood") {
    path = "/v1/graph";
    if (q.work_id) params.set("work_id", q.work_id);
    if (q.topic) params.set("topic", q.topic);
    if (q.depth) params.set("depth", String(q.depth));
  } else if (q.mode === "entities") {
    path = "/v1/graph/triples";
    if (q.work_id) params.set("work_id", q.work_id);
    if (q.q) params.set("q", q.q);
    if (q.limit) params.set("limit", String(q.limit));
  } else {
    if (q.topic) params.set("topic", q.topic);
    params.set("limit", String(q.limit ?? 80));
  }
  const suffix = params.toString() ? `?${params}` : "";
  try {
    const res = await kbFetch(`${path}${suffix}`);
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (e) {
    if (e instanceof KbUpstreamError && e.warming) {
      return NextResponse.json({ nodes: [], edges: [], warming: true });
    }
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}