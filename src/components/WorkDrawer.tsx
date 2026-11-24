"use client";

import { useEffect, useState } from "react";

import type { WorkDetail } from "@/lib/types";

type Props = {
  workId: string | null;
  onClose: () => void;
};

export function WorkDrawer({ workId, onClose }: Props) {
  const [detail, setDetail] = useState<WorkDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!workId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setFailed(false);
    setDetail(null);
    fetch(`/api/works/${workId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: WorkDetail | null) => {
        if (d?.work) setDetail(d);
        else setFailed(true);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [workId]);

  if (!workId) return null;

  return (
    <aside className="drawer" role="dialog" aria-label="Work detail">
      <button type="button" className="drawer-close" onClick={onClose}>
        Close
      </button>
      {loading && <p>Loading…</p>}
      {failed && <p className="meta">Could not load this paper. Try again in a moment.</p>}
      {detail && (
        <>
          <h2>{detail.work.title}</h2>
          <p className="meta">
            {detail.work.year} · {detail.work.licence_tier}
            {detail.work.doi && <> · DOI {detail.work.doi}</>}
          </p>
          <p className="meta">Cited by {detail.work.cited_by_count ?? 0}</p>
          <h3>Sections</h3>
          <ul>
            {detail.chunks.map((c) => (
              <li key={c.id}>
                <strong>{c.heading ?? "Section"}</strong>
                {c.snippet && <p>{c.snippet}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
