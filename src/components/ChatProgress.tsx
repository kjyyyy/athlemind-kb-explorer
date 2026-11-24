"use client";

import { useEffect, useRef, useState } from "react";

import type { EvidenceStage } from "@/lib/types";

const STAGE_LABEL: Record<EvidenceStage, string> = {
  queued: "Understanding your question",
  embedding: "Understanding your question",
  searching: "Searching the library",
  reranking: "Ranking the best evidence",
  writing: "Writing a cited answer",
  done: "Done",
};

/** Ceiling the bar may creep toward while a stage is running (just below the next stage). */
const STAGE_CEILING: Record<EvidenceStage, number> = {
  queued: 9,
  embedding: 28,
  searching: 53,
  reranking: 73,
  writing: 96,
  done: 100,
};

const SLOW_AFTER_S = 45;

type Props = {
  stage: EvidenceStage;
  progress: number;
  startedAt: number;
  state: "loading" | "done" | "error";
};

export function ChatProgress({ stage, progress, startedAt, state }: Props) {
  const [shown, setShown] = useState(progress);
  const [elapsed, setElapsed] = useState(0);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (state === "done") {
      setShown(100);
      return;
    }
    setShown((s) => Math.max(s, progress));
    if (state !== "loading") return;
    const ceiling = STAGE_CEILING[stage];
    const id = window.setInterval(() => {
      setShown((s) => {
        const floor = Math.max(s, progress);
        if (reduceMotion.current) return floor;
        return floor + Math.max(0, ceiling - floor) * 0.035;
      });
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 200);
    return () => window.clearInterval(id);
  }, [progress, stage, startedAt, state]);

  const label = state === "error" ? "Something went wrong" : STAGE_LABEL[stage];
  const pct = Math.round(Math.min(100, shown));

  return (
    <div className={`chat-progress chat-progress--${state}`}>
      <div
        className="chat-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={label}
      >
        <div className="chat-progress-fill" style={{ transform: `scaleX(${shown / 100})` }} />
      </div>
      <div className="chat-progress-label">
        <span>{label}…</span>
        {state === "loading" && (
          <span className="chat-progress-meta">
            {elapsed > SLOW_AFTER_S ? "Taking longer than usual · " : ""}
            {elapsed}s
          </span>
        )}
      </div>
    </div>
  );
}
