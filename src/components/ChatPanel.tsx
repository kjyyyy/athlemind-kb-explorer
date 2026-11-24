"use client";

import { FormEvent, useMemo, useState } from "react";

import type { ChatResponse, EvidenceSource } from "@/lib/types";

const SUGGESTIONS = [
  "Does cold water immersion help recovery?",
  "How does sleep affect athletic performance?",
  "What is the evidence on training load monitoring?",
];

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSources: (workIds: string[]) => void;
  onFocusCitation: (workId: string, index: number) => void;
};

type Msg = {
  role: "user" | "assistant";
  text: string;
  sources?: EvidenceSource[];
};

export function ChatPanel({ collapsed, onToggleCollapse, onSources, onFocusCitation }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, limit: 8 }),
      });
      const data: ChatResponse & { error?: string; warming?: boolean } = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: data.error ?? "Something went wrong." },
        ]);
        return;
      }
      onSources(data.sources?.map((s) => s.work_id) ?? []);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer, sources: data.sources },
      ]);
    } finally {
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

  if (collapsed) {
    return (
      <aside className="chat-rail">
        <button type="button" className="chat-rail-btn" onClick={onToggleCollapse} aria-expanded={false}>
          Evidence chat
        </button>
      </aside>
    );
  }

  return (
    <aside className="chat-panel">
      <header className="chat-header">
        <div>
          <h1>Evidence chat</h1>
          <p>Grounded answers with cited sources from the research library.</p>
        </div>
        <button type="button" className="chat-collapse" onClick={onToggleCollapse} aria-label="Collapse chat">
          Hide
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
                onFocusCitation={onFocusCitation}
              />
            ) : (
              <p>{msg.text}</p>
            )}
            {msg.sources && (
              <ul className="source-list">
                {msg.sources.map((s, idx) => (
                  <li key={s.chunk_id}>
                    <button
                      type="button"
                      className="source-card"
                      onClick={() => onFocusCitation(s.work_id, idx + 1)}
                    >
                      <span className="cite-chip">[{idx + 1}]</span>
                      <span className="source-title">{s.title}</span>
                      <span className="tier">{s.licence_tier}</span>
                    </button>
                    {s.snippet && <p className="snippet">{s.snippet.slice(0, 200)}…</p>}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
        {loading && (
          <div className="chat-skeleton" aria-busy="true">
            <span className="sk-line" />
            <span className="sk-line sk-line--short" />
          </div>
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
    </aside>
  );
}

function AnswerBody({
  text,
  sources,
  onFocusCitation,
}: {
  text: string;
  sources?: EvidenceSource[];
  onFocusCitation: (workId: string, index: number) => void;
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
                onClick={() => onFocusCitation(src.work_id, idx + 1)}
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