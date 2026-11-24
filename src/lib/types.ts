export type GraphNode = {
  id: string;
  type?: "topic" | "work" | "entity";
  label?: string;
  title?: string;
  year?: number;
  licence_tier?: string;
  cited_by_count?: number;
  count?: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  kind?: string;
};

export type GraphPayload = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type EvidenceSource = {
  chunk_id: string;
  work_id: string;
  title: string;
  heading?: string | null;
  licence_tier: string;
  snippet?: string | null;
};

export type ChatResponse = {
  query: string;
  answer: string;
  sources: EvidenceSource[];
  warming?: boolean;
};

export type EvidenceStage = "queued" | "embedding" | "searching" | "reranking" | "writing" | "done";

export type EvidenceJob = {
  job_id: string;
  status: "pending" | "done" | "error";
  stage: EvidenceStage;
  progress: number;
  elapsed_s?: number;
  result?: ChatResponse;
  error?: string;
};

export type PaperHit = {
  id: string;
  title: string;
  year?: number | null;
  cited_by_count?: number | null;
  links: number;
};

export type WorkDetail = {
  work: {
    id: string;
    title: string;
    year?: number;
    doi?: string;
    licence_tier?: string;
    licence?: string;
    cited_by_count?: number;
    topics?: unknown;
  };
  references: Array<{ cited_work_id: string; cited_title_norm?: string }>;
  cited_by: string[];
  chunks: Array<{ id: string; heading?: string; snippet?: string }>;
};