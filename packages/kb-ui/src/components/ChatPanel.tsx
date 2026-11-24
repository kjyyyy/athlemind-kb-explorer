"use client";

import { FormEvent, useMemo, useState } from "react";

import { useKbClient, useKbClientConfig } from "../KbClientProvider";
import { ChatProgress } from "./ChatProgress";
import { revealPassage, SourceList } from "./SourceList";
import type { ChatResponse, EvidenceSource, EvidenceStage } from "../lib/types";
const FADE_MS = 350;

const ERROR_TEXT: Record<string, string> = {
  rate_limited: "You're asking quickly — please wait a few seconds and try again.",
  warming: "The knowledge base is starting up. Please try again in a minute.",
  timeout: "The answer took too long. Please try again.",
  job_lost: "The server restarted while answering. Please ask again.",
  invalid_request: "That question couldn't be sent. Try rephrasing it.",
  network: "Couldn't reach the server. Check your connection and try again.",
};
const FALLBACK_ERROR = "Something went wrong answering that. Please try again.";

type Progress = {
  stage: EvidenceStage;
  progress: number;
  startedAt: number;
  state: "loading" | "done" | "error";
};


const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SUGGESTIONS = [
  "Does cold water immersion help recovery?",
  "How does sleep affect athletic performance?",
  "What is the evidence on training load monitoring?",
];

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSources: (workIds: string[]) => void;
  onFocusCitation: (workId: string) => void;
  onOpenWork: (workId: string) => void;
  onExchangeComplete?: (question: string, result: ChatResponse) => void;
};

type Msg = {
  role: "user" | "assistant";
  text: string;
  sources?: EvidenceSource[];
  queryId?: string;
  feedback?: "up" | "down";
};

export function ChatPanel({
  collapsed,
  onToggleCollapse,
  onSources,
  onFocusCitation,
  onOpenWork,
  onExchangeComplete,
}: Props) {
  const kb = useKbClient();
  const kbCfg = useKbClientConfig();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);

  function fail(code: string | undefined) {
    setProgress((p) => (p ? { ...p, state: "error" } : p));
    setMessages((m) => [
      ...m,
      { role: "assistant", text: (code && ERROR_TEXT[code]) || FALLBACK_ERROR },
    ]);
  }

  async function runJob(q: string): Promise<ChatResponse | string> {
    const created = await kb.createEvidenceJob({ query: q, limit: 8 });
    if (!created.job_id) return created.error ?? "unavailable";

    const deadline = Date.now() + (kbCfg.maxWaitMs ?? 90_000);
    const pollMs = kbCfg.pollMs ?? 1500;
    while (Date.now() < deadline) {
      await sleep(pollMs);
      const status = await kb.getEvidenceJob(created.job_id);
      if (status.error === "rate_limited") continue;
      if (status.error) return status.error;
      if (status.status === "error") return "failed";
      setProgress((p) => (p ? { ...p, stage: status.stage, progress: status.progress } : p));
      if (status.status === "done" && status.result) return status.result;
    }
    return "timeout";
  }

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    setProgress({ stage: "queued", progress: 5, startedAt: Date.now(), state: "loading" });
    try {
      const outcome = await runJob(q);
      if (typeof outcome === "string") {
        fail(outcome);
        await sleep(700);
        return;
      }
      setProgress((p) => (p ? { ...p, stage: "done", progress: 100, state: "done" } : p));
      await sleep(FADE_MS);
      onSources(outcome.sources?.map((s) => s.work_id) ?? []);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: outcome.answer,
          sources: outcome.sources,
          queryId: outcome.query_id,
        },
      ]);
      onExchangeComplete?.(q, outcome);
    } catch {
      fail("network");
    } finally {
      setProgress(null);
      setLoading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput("");
    void ask(q);
  }

  async function submitFeedback(index: number, rating: "up" | "down") {
    const msg = messages[index];
    if (!msg?.queryId || msg.feedback === rating) return;
    setMessages((m) => m.map((row, i) => (i === index ? { ...row, feedback: rating } : row)));
    const res = await kb.submitEvidenceFeedback(msg.queryId, { rating });
    if (res.error) {
      setMessages((m) => m.map((row, i) => (i === index ? { ...row, feedback: undefined } : row)));
    }
  }

  if (collapsed) {
    return (
      <aside className="chat-rail">
        <button
          type="button"
          className="chat-rail-btn"
          onClick={onToggleCollapse}
          aria-expanded={false}
          aria-label="Show evidence chat"
          title="Show evidence chat"
        >
          <PanelIcon open={false} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="chat-panel">
      <header className="chat-header">
        <div>
          <h1>Evidence chat</h1>
          <p>Grounded answers from the sport psychology research library.</p>
        </div>
        <button
          type="button"
          className="chat-collapse"
          onClick={onToggleCollapse}
          aria-expanded
          aria-label="Hide evidence chat"
          title="Hide evidence chat"
        >
          <PanelIcon open />
        </button>
      </header>
      <div className="chat-messages" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="chat-hint">Try a suggested question:</p>
            <div className="suggestion-row">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="suggestion-chip" onClick={() => void ask(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <article key={i} className={`bubble bubble-${msg.role}`}>
            {msg.role === "assistant" ? (
              <AnswerBody
                text={msg.text}
                sources={msg.sources}
                onCite={(workId, n) => {
                  onFocusCitation(workId);
                  revealPassage(String(i), n);
                }}
              />
            ) : (
              <p>{msg.text}</p>
            )}
            {msg.sources && msg.sources.length > 0 && (
              <SourceList
                messageKey={String(i)}
                answer={msg.text}
                sources={msg.sources}
                onFocusCitation={onFocusCitation}
                onOpenWork={onOpenWork}
              />
            )}
            {msg.role === "assistant" && msg.queryId && (
              <div className="answer-feedback" aria-label="Rate this answer">
                <span className="answer-feedback-label">Helpful?</span>
                <button
                  type="button"
                  className={`feedback-btn ${msg.feedback === "up" ? "is-active" : ""}`}
                  aria-pressed={msg.feedback === "up"}
                  aria-label="Thumbs up"
                  onClick={() => void submitFeedback(i, "up")}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={`feedback-btn ${msg.feedback === "down" ? "is-active" : ""}`}
                  aria-pressed={msg.feedback === "down"}
                  aria-label="Thumbs down"
                  onClick={() => void submitFeedback(i, "down")}
                >
                  ↓
                </button>
              </div>
            )}
          </article>
        ))}
        {progress && (
          <ChatProgress
            stage={progress.stage}
            progress={progress.progress}
            startedAt={progress.startedAt}
            state={progress.state}
          />
        )}
      </div>
      <form className="chat-form" onSubmit={submit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Your question…"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>
      <p className="chat-storage-notice">
        Questions are stored to improve answers. Don&apos;t include personal information.
      </p>
    </aside>
  );
}

function PanelIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d={open ? "m16 15-3-3 3-3" : "m14 9 3 3-3 3"} />
    </svg>
  );
}

function AnswerBody({
  text,
  sources,
  onCite,
}: {
  text: string;
  sources?: EvidenceSource[];
  onCite: (workId: string, index: number) => void;
}) {
  const parts = useMemo(() => text.split(/(\[\d+\])/g), [text]);
  return (
    <p className="answer-body">
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (m && sources) {
          const idx = Number(m[1]) - 1;
          const src = sources[idx];
          if (src) {
            return (
              <button
                key={i}
                type="button"
                className="inline-cite"
                onClick={() => onCite(src.work_id, idx + 1)}
              >
                {part}
              </button>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}