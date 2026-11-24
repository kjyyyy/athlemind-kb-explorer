import type {
  ChatResponse,
  EntityHit,
  EvidenceJob,
  GraphResponse,
  KbClient,
  PaperHit,
  TopicHit,
  WorkDetail,
} from "@athlemind/kb-ui";
import type { GraphQuery } from "@athlemind/kb-ui";

import { explorerSessionId } from "@/lib/session";

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const nextKbClient: KbClient = {
  async createEvidenceJob({ query, limit }) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        limit: limit ?? 8,
        session_id: explorerSessionId() || undefined,
      }),
    });
    const body = await readJson<{ job_id?: string; error?: string }>(res);
    if (!res.ok || !body?.job_id) return { error: body?.error ?? "unavailable" };
    return { job_id: body.job_id };
  },

  async getEvidenceJob(jobId) {
    const res = await fetch(`/api/chat/jobs/${jobId}`);
    const body = await readJson<EvidenceJob & { error?: string }>(res);
    if (res.status === 429) {
      return {
        job_id: jobId,
        status: "pending",
        stage: "queued",
        progress: 0,
        error: "rate_limited",
      } satisfies EvidenceJob & { error?: string };
    }
    if (!res.ok || !body) {
      return {
        job_id: jobId,
        status: "error",
        stage: "queued",
        progress: 0,
        error: body?.error ?? "unavailable",
      } satisfies EvidenceJob & { error?: string };
    }
    return body;
  },

  async searchWorks(q, limit, signal) {
    const res = await fetch(`/api/works/search?${new URLSearchParams({ q, limit: String(limit) })}`, {
      signal,
    });
    if (!res.ok) return [] as PaperHit[];
    const body = (await res.json()) as { results?: PaperHit[] };
    return body.results ?? [];
  },

  async searchTopics(q, limit, signal) {
    const res = await fetch(`/api/topics/search?${new URLSearchParams({ q, limit: String(limit) })}`, { signal });
    if (!res.ok) return [] as TopicHit[];
    const body = (await res.json()) as { results?: TopicHit[] };
    return body.results ?? [];
  },

  async searchEntities(q, limit, signal) {
    const res = await fetch(`/api/entities/search?${new URLSearchParams({ q, limit: String(limit) })}`, { signal });
    if (!res.ok) return [] as EntityHit[];
    const body = (await res.json()) as { results?: EntityHit[] };
    return body.results ?? [];
  },

  async getGraph(params: GraphQuery) {
    const qs = new URLSearchParams({ mode: params.mode });
    if (params.topic) qs.set("topic", params.topic);
    if (params.workId) qs.set("work_id", params.workId);
    if (params.depth != null) qs.set("depth", String(params.depth));
    if (params.entity) qs.set("q", params.entity);
    if (params.limit != null) qs.set("limit", String(params.limit));
    const res = await fetch(`/api/graph?${qs}`);
    const data = (await res.json()) as GraphResponse;
    if (!res.ok) return { ...data, error: data.error ?? "upstream_error" };
    return data;
  },

  async getWork(workId) {
    const res = await fetch(`/api/works/${workId}`);
    if (!res.ok) return null;
    return (await res.json()) as WorkDetail;
  },

  async submitEvidenceFeedback(queryId, { rating, comment }) {
    const res = await fetch(`/api/evidence/queries/${encodeURIComponent(queryId)}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        comment,
        session_id: explorerSessionId() || undefined,
      }),
    });
    const body = await readJson<{ recorded?: boolean; error?: string }>(res);
    if (!res.ok || !body?.recorded) return { error: body?.error ?? "unavailable" };
    return { recorded: true };
  },
};