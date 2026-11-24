"use client";

import { FormEvent, useState } from "react";

import type { ChatResponse, EvidenceSource } from "@/lib/types";

type Props = {
  onSources: (workIds: string[]) => void;
};

export function ChatPanel({ onSources }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; text: string; sources?: EvidenceSource[] }>
  >([]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, limit: 8 }),
      });
      const data: ChatResponse & { error?: string } = await res.json();
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

  return (
    <section className="chat">
      <header className="chat-header">
        <h1>Evidence chat</h1>
        <p>Answers are grounded in the research library with cited sources.</p>
      </header>
      <div className="chat-messages" aria-live="polite">
        {messages.length === 0 && (
          <p className="chat-hint">Ask about training load, recovery, or athlete wellbeing.</p>
        )}
        {messages.map((msg, i) => (
          <article key={i} className={`bubble bubble-${msg.role}`}>
            <p>{msg.text}</p>
            {msg.sources && (
              <ul className="source-list">
                {msg.sources.map((s, idx) => (
                  <li key={s.chunk_id}>
                    <span className="cite-chip">[{idx + 1}]</span> {s.title}
                    <span className="tier">{s.licence_tier}</span>
                    {s.snippet && <p className="snippet">{s.snippet.slice(0, 280)}…</p>}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
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
    </section>
  );
}