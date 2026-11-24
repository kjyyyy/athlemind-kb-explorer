import type {
  ChatResponse,
  EntityHit,
  EvidenceJob,
  GraphEdge,
  GraphNode,
  PaperHit,
  TopicHit,
  WorkDetail,
} from "./lib/types";

export type GraphQuery = {
  mode: "overview" | "neighbourhood" | "entities";
  topic?: string;
  workId?: string;
  depth?: number;
  entity?: string;
  limit?: number;
};

export type GraphResponse = {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  warming?: boolean;
  error?: string;
  entities_unavailable?: boolean;
  message?: string;
  hint?: string;
};

export type KbClient = {
  createEvidenceJob(input: {
    query: string;
    limit?: number;
  }): Promise<{ job_id?: string; error?: string }>;
  getEvidenceJob(jobId: string): Promise<EvidenceJob & { error?: string }>;
  searchWorks(q: string, limit: number, signal?: AbortSignal): Promise<PaperHit[]>;
  searchTopics(q: string, limit: number, signal?: AbortSignal): Promise<TopicHit[]>;
  searchEntities(q: string, limit: number, signal?: AbortSignal): Promise<EntityHit[]>;
  getGraph(params: GraphQuery): Promise<GraphResponse>;
  getWork(workId: string): Promise<WorkDetail | null>;
};

export type KbClientConfig = {
  pollMs?: number;
  maxWaitMs?: number;
};

export async function waitForEvidenceJob(
  client: KbClient,
  jobId: string,
  cfg: KbClientConfig = {},
): Promise<ChatResponse | string> {
  const pollMs = cfg.pollMs ?? 1500;
  const maxWaitMs = cfg.maxWaitMs ?? 90_000;
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollMs));
    const status = await client.getEvidenceJob(jobId);
    if (status.error === "rate_limited") continue;
    if (status.error) return status.error;
    if (status.status === "error") return "failed";
    if (status.status === "done" && status.result) return status.result;
  }
  return "timeout";
}