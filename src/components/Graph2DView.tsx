"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import type { EnrichedNode, ForceGraphData } from "@/lib/graph-model";
import { neighbourSet } from "@/lib/graph-model";
import { readThemeColors } from "@/lib/theme";
import type { GraphNode } from "@/lib/types";

import { NodeHoverCard } from "@/components/NodeHoverCard";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type Props = {
  data: ForceGraphData;
  highlightWorkIds: string[];
  onSelectWork: (id: string) => void;
};

export function Graph2DView({ data, highlightWorkIds, onSelectWork }: Props) {
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const theme = readThemeColors();
  const highlight = useMemo(() => new Set(highlightWorkIds), [highlightWorkIds]);
  const focusNeighbours = useMemo(
    () => neighbourSet(hovered?.id ?? null, data.links),
    [hovered, data.links],
  );

  return (
    <div
      className="graph-canvas graph-canvas--2d"
      onMouseMove={(e) => setPointer({ x: e.clientX, y: e.clientY })}
    >
      <NodeHoverCard node={hovered} x={pointer.x} y={pointer.y} />
      <ForceGraph2D
        graphData={data}
        backgroundColor={theme.brandNavy}
        nodeRelSize={6}
        nodeVal="val"
        linkColor={() => "rgba(180,210,255,0.28)"}
        linkWidth={0.8}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        nodeLabel=""
        onNodeHover={(n) => setHovered((n as GraphNode) ?? null)}
        onNodeClick={(n) => {
          const node = n as EnrichedNode;
          if (node.type === "work" || node.id.length === 36) onSelectWork(node.id);
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as EnrichedNode & { x?: number; y?: number };
          if (n.x == null || n.y == null) return;
          const dim =
            hovered && !focusNeighbours.has(n.id) && !highlight.has(n.id) ? 0.15 : 1;
          const r = Math.max(3, (n.val ?? 4) * 1.1) / globalScale;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = highlight.has(n.id) ? theme.primary : n.color;
          ctx.globalAlpha = dim;
          ctx.fill();
          ctx.globalAlpha = 1;
          if (highlight.has(n.id)) {
            ctx.strokeStyle = theme.primaryHover;
            ctx.lineWidth = 1.5 / globalScale;
            ctx.stroke();
          }
        }}
      />
    </div>
  );
}