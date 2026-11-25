import * as react from 'react';
import { ReactNode } from 'react';

type GraphMode = "overview" | "neighbourhood" | "entities" | "answer";
type Props$2 = {
    highlightWorkIds: string[];
    answerWorkIds: string[];
    focusWorkId: string | null;
    onSelectWork: (id: string) => void;
    onFocusWork: (id: string) => void;
    onResetFocus?: () => void;
};
declare function GraphPanel({ highlightWorkIds, answerWorkIds, focusWorkId, onSelectWork, onFocusWork, }: Props$2): react.JSX.Element;

type GraphNode = {
    id: string;
    type?: "topic" | "work" | "entity";
    label?: string;
    title?: string;
    year?: number;
    licence_tier?: string;
    cited_by_count?: number;
    count?: number;
};
type GraphEdge = {
    source: string;
    target: string;
    kind?: string;
};
type GraphPayload = {
    nodes: GraphNode[];
    edges: GraphEdge[];
};
type EvidenceSource = {
    chunk_id: string;
    work_id: string;
    title: string;
    heading?: string | null;
    licence_tier: string;
    snippet?: string | null;
};
type ChatResponse = {
    query_id?: string;
    query: string;
    answer: string;
    sources: EvidenceSource[];
    warming?: boolean;
    timings?: Record<string, number>;
    model?: string;
};
type EvidenceStage = "queued" | "embedding" | "searching" | "reranking" | "writing" | "done";
type EvidenceJob = {
    job_id: string;
    status: "pending" | "done" | "error";
    stage: EvidenceStage;
    progress: number;
    elapsed_s?: number;
    result?: ChatResponse;
    error?: string;
};
type PaperHit = {
    id: string;
    title: string;
    year?: number | null;
    cited_by_count?: number | null;
    links: number;
};
type TopicHit = {
    label: string;
    papers: number;
};
type EntityHit = {
    label: string;
    mentions: number;
};
type WorkDetail = {
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
    references: Array<{
        cited_work_id: string;
        cited_title_norm?: string;
    }>;
    cited_by: string[];
    chunks: Array<{
        id: string;
        heading?: string;
        snippet?: string;
    }>;
};

type Props$1 = {
    collapsed: boolean;
    onToggleCollapse: () => void;
    onSources: (workIds: string[]) => void;
    onFocusCitation: (workId: string) => void;
    onOpenWork: (workId: string) => void;
    onExchangeComplete?: (question: string, result: ChatResponse) => void;
};
declare function ChatPanel({ collapsed, onToggleCollapse, onSources, onFocusCitation, onOpenWork, onExchangeComplete, }: Props$1): react.JSX.Element;

type Props = {
    workId: string | null;
    onClose: () => void;
};
declare function WorkDrawer({ workId, onClose }: Props): react.JSX.Element | null;

type GraphQuery = {
    mode: "overview" | "neighbourhood" | "entities" | "answer";
    topic?: string;
    workId?: string;
    workIds?: string[];
    depth?: number;
    entity?: string;
    limit?: number;
};
type GraphResponse = {
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    warming?: boolean;
    error?: string;
    entities_unavailable?: boolean;
    message?: string;
    hint?: string;
};
type KbClient = {
    createEvidenceJob(input: {
        query: string;
        limit?: number;
    }): Promise<{
        job_id?: string;
        error?: string;
    }>;
    getEvidenceJob(jobId: string): Promise<EvidenceJob & {
        error?: string;
    }>;
    searchWorks(q: string, limit: number, signal?: AbortSignal): Promise<PaperHit[]>;
    searchTopics(q: string, limit: number, signal?: AbortSignal): Promise<TopicHit[]>;
    searchEntities(q: string, limit: number, signal?: AbortSignal): Promise<EntityHit[]>;
    getGraph(params: GraphQuery): Promise<GraphResponse>;
    getWork(workId: string): Promise<WorkDetail | null>;
    submitEvidenceFeedback(queryId: string, input: {
        rating: "up" | "down";
        comment?: string;
    }): Promise<{
        recorded?: boolean;
        error?: string;
    }>;
};
type KbClientConfig = {
    pollMs?: number;
    maxWaitMs?: number;
};
declare function waitForEvidenceJob(client: KbClient, jobId: string, cfg?: KbClientConfig): Promise<ChatResponse | string>;

declare function KbClientProvider({ client, config, children, }: {
    client: KbClient;
    config?: KbClientConfig;
    children: ReactNode;
}): react.JSX.Element;
declare function useKbClient(): KbClient;
declare function useKbClientConfig(): KbClientConfig;

export { ChatPanel, type ChatResponse, type EntityHit, type EvidenceJob, type EvidenceSource, type EvidenceStage, type GraphEdge, type GraphMode, type GraphNode, GraphPanel, type GraphPayload, type GraphQuery, type GraphResponse, type KbClient, type KbClientConfig, KbClientProvider, type PaperHit, type TopicHit, type WorkDetail, WorkDrawer, useKbClient, useKbClientConfig, waitForEvidenceJob };
