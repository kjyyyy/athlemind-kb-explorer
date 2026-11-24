"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import type { PaperHit } from "@/lib/types";

const DEBOUNCE_MS = 180;

type Props = {
  selectedTitle: string | null;
  onPick: (paper: PaperHit) => void;
};

export function PaperPicker({ selectedTitle, onPick }: Props) {
  const [query, setQuery] = useState(selectedTitle ?? "");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<PaperHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedTitle) setQuery(selectedTitle);
  }, [selectedTitle]);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/works/search?${new URLSearchParams({ q: query.trim(), limit: "10" })}`, {
        signal: ctrl.signal,
      })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((d: { results?: PaperHit[] }) => {
          const results = d.results ?? [];
          setHits([...results.filter((p) => p.links > 0), ...results.filter((p) => p.links === 0)]);
          setActive(0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [open, query]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pick(p: PaperHit) {
    setQuery(p.title);
    setOpen(false);
    onPick(p);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && hits[active]) {
      e.preventDefault();
      pick(hits[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="paper-picker" ref={wrapRef}>
      <input
        className="graph-search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={(e) => {
          e.target.select();
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder="Type a paper title…"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Choose a paper to explore its citations"
      />
      {open && (
        <ul className="paper-picker-list" id={listId} role="listbox">
          {!query.trim() && <li className="paper-picker-note">Most-cited papers</li>}
          {loading && hits.length === 0 && <li className="paper-picker-note">Searching…</li>}
          {!loading && hits.length === 0 && (
            <li className="paper-picker-note">No papers match “{query.trim()}”.</li>
          )}
          {hits.map((p, i) => (
            <li
              key={p.id}
              role="option"
              aria-selected={i === active}
              className={`paper-picker-item${i === active ? " is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(p);
              }}
            >
              <span className="paper-picker-title">{p.title}</span>
              <span className="paper-picker-meta">
                {p.year ?? "n.d."} · {p.links} citation link{p.links === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
