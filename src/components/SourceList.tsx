"use client";

import { useMemo } from "react";

import { tierLabel } from "@/lib/licence";
import type { EvidenceSource } from "@/lib/types";

type Passage = { n: number; source: EvidenceSource; cited: boolean };
type PaperGroup = { workId: string; title: string; tier: string; passages: Passage[]; cited: boolean };

export function citedNumbers(text: string): Set<number> {
  return new Set([...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
}

export function passageDomId(messageKey: string, n: number) {
  return `src-${messageKey}-${n}`;
}

function groupByPaper(sources: EvidenceSource[], cited: Set<number>): PaperGroup[] {
  const groups = new Map<string, PaperGroup>();
  sources.forEach((source, i) => {
    const n = i + 1;
    let g = groups.get(source.work_id);
    if (!g) {
      g = { workId: source.work_id, title: source.title, tier: source.licence_tier, passages: [], cited: false };
      groups.set(source.work_id, g);
    }
    g.passages.push({ n, source, cited: cited.has(n) });
    g.cited ||= cited.has(n);
  });
  return [...groups.values()].sort((a, b) => Number(b.cited) - Number(a.cited));
}

type Props = {
  messageKey: string;
  answer: string;
  sources: EvidenceSource[];
  onFocusCitation: (workId: string, index: number) => void;
};

export function SourceList({ messageKey, answer, sources, onFocusCitation }: Props) {
  const groups = useMemo(() => groupByPaper(sources, citedNumbers(answer)), [sources, answer]);
  const firstUncited = groups.findIndex((g) => !g.cited);

  return (
    <section className="sources" aria-label="Sources">
      <h2 className="sources-heading">
        Sources · {groups.length} {groups.length === 1 ? "paper" : "papers"}
      </h2>
      <ol className="source-groups">
        {groups.map((g, gi) => (
          <li key={g.workId}>
            {gi === firstUncited && gi > 0 && <p className="sources-subheading">Also retrieved</p>}
            <div className={`source-group${g.cited ? "" : " source-group--muted"}`}>
              <button
                type="button"
                className="source-group-title"
                onClick={() => onFocusCitation(g.workId, g.passages[0].n)}
              >
                {g.title}
              </button>
              <div className="source-group-meta">
                <span className="tier">{tierLabel(g.tier)}</span>
                <span className="source-chips">
                  {g.passages.map((p) => (
                    <button
                      key={p.n}
                      type="button"
                      className={`cite-chip${p.cited ? "" : " cite-chip--uncited"}`}
                      onClick={() => onFocusCitation(g.workId, p.n)}
                      title={p.cited ? `Passage ${p.n} (cited)` : `Passage ${p.n}`}
                    >
                      [{p.n}]
                    </button>
                  ))}
                </span>
              </div>
              {g.passages.some((p) => p.source.snippet) && (
                <details className="source-passages">
                  <summary>
                    Show {g.passages.length} {g.passages.length === 1 ? "passage" : "passages"}
                  </summary>
                  <ol>
                    {g.passages.map(
                      (p) =>
                        p.source.snippet && (
                          <li key={p.n} id={passageDomId(messageKey, p.n)} className="source-passage">
                            <span className="cite-chip">[{p.n}]</span>
                            <span>{p.source.snippet.slice(0, 220).trim()}…</span>
                          </li>
                        ),
                    )}
                  </ol>
                </details>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function revealPassage(messageKey: string, n: number) {
  const el = document.getElementById(passageDomId(messageKey, n));
  if (!el) return;
  const details = el.closest("details");
  if (details) details.open = true;
  el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  el.classList.remove("source-passage--flash");
  void el.offsetWidth;
  el.classList.add("source-passage--flash");
}
