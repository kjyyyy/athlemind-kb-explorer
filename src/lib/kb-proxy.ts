const TIMEOUT_MS = 30_000;

export class KbUpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly warming = false,
  ) {
    super(message);
  }
}

function baseUrl(): string {
  const url = process.env.KB_API_URL;
  if (!url) throw new Error("KB_API_URL not configured");
  return url.replace(/\/$/, "");
}

function token(): string {
  const t = process.env.KB_API_TOKEN;
  if (!t) throw new Error("KB_API_TOKEN not configured");
  return t;
}

export async function kbFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "X-KB-Token": token(),
        ...(init?.headers as Record<string, string> | undefined),
      },
      cache: "no-store",
    });
    if (res.status === 502 || res.status === 503) {
      throw new KbUpstreamError("KB API is warming up", res.status, true);
    }
    return res;
  } catch (e) {
    if (e instanceof KbUpstreamError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new KbUpstreamError("Request timed out", 504);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}