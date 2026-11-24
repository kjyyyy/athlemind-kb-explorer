const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  ip: string,
  opts: { scope?: string; max?: number } = {},
): { ok: true } | { ok: false; retryAfter: number } {
  const key = opts.scope ? `${opts.scope}:${ip}` : ip;
  const max = opts.max ?? MAX_PER_WINDOW;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (b.count >= max) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
