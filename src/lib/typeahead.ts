import type { EntityHit, PaperHit, TopicHit } from "@/lib/types";

async function fetchResults<T>(path: string, q: string, limit: number, signal: AbortSignal) {
  const res = await fetch(`${path}?${new URLSearchParams({ q, limit: String(limit) })}`, { signal });
  if (!res.ok) return [] as T[];
  const body = (await res.json()) as { results?: T[] };
  return body.results ?? [];
}

export const searchPapers = (q: string, limit: number, signal: AbortSignal) =>
  fetchResults<PaperHit>("/api/works/search", q, limit, signal);

export const searchTopics = (q: string, limit: number, signal: AbortSignal) =>
  fetchResults<TopicHit>("/api/topics/search", q, limit, signal);

export const searchEntities = (q: string, limit: number, signal: AbortSignal) =>
  fetchResults<EntityHit>("/api/entities/search", q, limit, signal);
