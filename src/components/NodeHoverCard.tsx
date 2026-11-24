"use client";

import type { GraphNode } from "@/lib/types";

type Props = {
  node: GraphNode | null;
  x: number;
  y: number;
};

export function NodeHoverCard({ node, x, y }: Props) {
  if (!node) return null;
  const title = node.label ?? node.title ?? node.id;
  const meta = [
    node.year,
    node.licence_tier,
    node.cited_by_count != null ? `${node.cited_by_count} cites` : null,
    node.type === "topic" && node.count != null ? `${node.count} papers` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="node-hover-card" style={{ left: x + 14, top: y + 14 }} role="tooltip">
      <strong>{title}</strong>
      {meta && <span className="node-hover-meta">{meta}</span>}
    </div>
  );
}