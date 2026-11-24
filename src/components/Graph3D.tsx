"use client";

import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EnrichedNode, ForceGraphData } from "@/lib/graph-model";
import { neighbourSet } from "@/lib/graph-model";
import { readThemeColors } from "@/lib/theme";
import type { GraphNode } from "@/lib/types";

import { NodeHoverCard } from "@/components/NodeHoverCard";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

type FGRef = {
  cameraPosition: (
    position: { x: number; y: number; z: number },
    lookAt?: { x?: number; y?: number; z?: number },
    ms?: number,
  ) => void;
  zoomToFit: (ms?: number, padding?: number, nodeFilter?: (n: object) => boolean) => void;
  controls: () => { autoRotate: boolean; autoRotateSpeed: number };
};

type Props = {
  data: ForceGraphData;
  highlightWorkIds: string[];
  focusWorkId: string | null;
  onSelectWork: (id: string) => void;
  onSearchSelect?: (id: string) => void;
  searchFlyId: string | null;
};

export function Graph3D({
  data,
  highlightWorkIds,
  focusWorkId,
  onSelectWork,
  searchFlyId,
}: Props) {
  const fgRef = useRef<FGRef | undefined>(undefined);
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const theme = readThemeColors();
  const highlight = useMemo(() => new Set(highlightWorkIds), [highlightWorkIds]);
  const focusNeighbours = useMemo(
    () => neighbourSet(hovered?.id ?? null, data.links),
    [hovered, data.links],
  );

  const flyTo = useCallback((node: EnrichedNode) => {
    const g = fgRef.current;
    if (!g || node.x == null || node.y == null || node.z == null) return;
    const dist = 140;
    const nx = node.x as number;
    const ny = node.y as number;
    const nz = (node.z as number) ?? 0;
    const distRatio = 1 + dist / Math.hypot(nx, ny, nz || 1);
    g.cameraPosition(
      { x: nx * distRatio, y: ny * distRatio, z: nz * distRatio + 40 },
      { x: nx, y: ny, z: nz },
      1600,
    );
  }, []);

  useEffect(() => {
    if (!focusWorkId) return;
    const node = data.nodes.find((n) => n.id === focusWorkId);
    if (node) flyTo(node);
  }, [data.nodes, focusWorkId, flyTo]);

  useEffect(() => {
    if (!searchFlyId) return;
    const node = data.nodes.find((n) => n.id === searchFlyId);
    if (node) flyTo(node);
  }, [searchFlyId, data.nodes, flyTo]);

  useEffect(() => {
    if (highlightWorkIds.length === 0 || !fgRef.current) return;
    const t = window.setTimeout(() => {
      fgRef.current?.zoomToFit(1200, 80, (n) => {
        const id = (n as EnrichedNode).id;
        return highlight.has(id);
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [highlight, highlightWorkIds]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setInterval(() => {
      const c = fgRef.current?.controls();
      if (c && !hovered) c.autoRotate = !reduce;
      if (c) c.autoRotateSpeed = 0.35;
    }, 500);
    return () => {
      window.clearInterval(id);
      const c = fgRef.current?.controls();
      if (c) c.autoRotate = false;
    };
  }, [hovered]);

  return (
    <div
      className="graph-canvas graph-canvas--3d"
      onMouseMove={(e) => setPointer({ x: e.clientX, y: e.clientY })}
    >
      <NodeHoverCard node={hovered} x={pointer.x} y={pointer.y} />
      <ForceGraph3D
        ref={fgRef as React.MutableRefObject<never>}
        graphData={data}
        backgroundColor={theme.brandNavy}
        nodeRelSize={5}
        nodeVal="val"
        nodeLabel={(n) => {
          const node = n as EnrichedNode;
          return node.type === "topic" ? String(node.label ?? node.name).slice(0, 36) : "";
        }}
        linkOpacity={0.22}
        linkWidth={0.6}
        linkDirectionalParticleWidth={1.2}
        linkDirectionalArrowLength={2.5}
        linkDirectionalArrowRelPos={0.92}
        nodeColor={(n) => {
          const node = n as EnrichedNode;
          if (highlight.has(node.id)) return theme.primary;
          if (hovered && !focusNeighbours.has(node.id)) {
            return `${node.color}33`;
          }
          return node.color;
        }}
        linkColor={(l) => {
          if (!hovered) return "rgba(200,220,255,0.35)";
          const src = String((l as { source: string | { id: string } }).source);
          const tgt = String((l as { target: string | { id: string } }).target);
          const sid = typeof src === "object" ? (src as { id: string }).id : src;
          const tid = typeof tgt === "object" ? (tgt as { id: string }).id : tgt;
          if (hovered?.id === sid || hovered?.id === tid) return theme.primary;
          return "rgba(120,140,170,0.12)";
        }}
        linkDirectionalParticles={(l) => {
          if (!hovered) return 0;
          const src = String((l as { source: string | { id: string } }).source);
          const tgt = String((l as { target: string | { id: string } }).target);
          const sid = typeof src === "object" ? (src as { id: string }).id : src;
          const tid = typeof tgt === "object" ? (tgt as { id: string }).id : tgt;
          return hovered.id === sid || hovered.id === tid ? 3 : 0;
        }}
        onNodeHover={(n) => setHovered((n as GraphNode) ?? null)}
        onNodeClick={(n) => {
          const node = n as EnrichedNode;
          flyTo(node);
          if (node.type === "work" || node.id.length === 36) {
            onSelectWork(node.id);
          }
        }}
      />
    </div>
  );
}