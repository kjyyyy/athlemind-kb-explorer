"use client";

import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { EnrichedNode, ForceGraphData } from "../lib/graph-model";
import { neighbourSet } from "../lib/graph-model";
import { readThemeColors } from "../lib/theme";
import type { GraphNode } from "../lib/types";

import { NodeHoverCard } from "./NodeHoverCard";

const ForceGraph3D = lazy(() => import("react-force-graph-3d"));

function linkEndpointId(endpoint: string | { id: string }): string {
  return typeof endpoint === "object" ? endpoint.id : endpoint;
}

type FGRef = {
  cameraPosition: (
    position: { x: number; y: number; z: number },
    lookAt?: { x?: number; y?: number; z?: number },
    ms?: number,
  ) => void;
  zoomToFit: (ms?: number, padding?: number, nodeFilter?: (n: object) => boolean) => void;
  controls: () => { autoRotate: boolean; autoRotateSpeed: number };
  scene: () => THREE.Scene;
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
    if (!data.nodes.some((n) => highlight.has(n.id))) return;
    const t = window.setTimeout(() => {
      fgRef.current?.zoomToFit(1200, 80, (n) => {
        const id = (n as EnrichedNode).id;
        return highlight.has(id);
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [highlight, highlightWorkIds, data.nodes]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setInterval(() => {
      const c = fgRef.current?.controls();
      if (c && !hovered) c.autoRotate = !reduce;
      if (c) c.autoRotateSpeed = 0.28;
    }, 500);
    return () => {
      window.clearInterval(id);
      const c = fgRef.current?.controls();
      if (c) c.autoRotate = false;
    };
  }, [hovered]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const g = fgRef.current;
      if (!g) return;
      const scene = g.scene();
      scene.fog = new THREE.FogExp2(0x060708, 0.0016);
      if (!scene.getObjectByName("kb-lights")) {
        const grp = new THREE.Group();
        grp.name = "kb-lights";
        grp.add(new THREE.AmbientLight(0xfff0e6, 0.72));
        const key = new THREE.DirectionalLight(0xff8a40, 0.85);
        key.position.set(160, 220, 120);
        grp.add(key);
        const fill = new THREE.DirectionalLight(0x60c090, 0.25);
        fill.position.set(-120, -80, 60);
        grp.add(fill);
        scene.add(grp);
      }
      window.clearInterval(id);
    }, 120);
    return () => window.clearInterval(id);
  }, [data]);

  return (
    <div
      className="graph-canvas graph-canvas--3d"
      onMouseMove={(e) => setPointer({ x: e.clientX, y: e.clientY })}
    >
      <NodeHoverCard node={hovered} x={pointer.x} y={pointer.y} />
      <Suspense fallback={<p className="graph-status">Loading 3D view…</p>}>
      <ForceGraph3D
        ref={fgRef as React.MutableRefObject<never>}
        graphData={data}
        backgroundColor="rgba(0,0,0,0)"
        showNavInfo={false}
        nodeRelSize={5}
        nodeVal="val"
        nodeLabel={(n) => {
          const node = n as EnrichedNode;
          if (node.type === "topic") return String(node.label ?? node.name).slice(0, 36);
          if (node.type === "entity") return String(node.label ?? node.name).slice(0, 48);
          return "";
        }}
        nodeOpacity={0.92}
        nodeColor={(n) => {
          const node = n as EnrichedNode;
          if (highlight.has(node.id)) return theme.primary;
          if (hovered && !focusNeighbours.has(node.id)) return `${node.color}44`;
          return node.color;
        }}
        linkOpacity={0.35}
        linkWidth={0.55}
        linkDirectionalParticleWidth={1.4}
        linkDirectionalParticleColor={() => theme.primaryHover}
        linkDirectionalArrowLength={2.2}
        linkDirectionalArrowRelPos={0.92}
        linkColor={(l) => {
          if (!hovered) return "rgba(255, 140, 60, 0.22)";
          const { source, target } = l as { source: string | { id: string }; target: string | { id: string } };
          const sid = linkEndpointId(source);
          const tid = linkEndpointId(target);
          if (hovered.id === sid || hovered.id === tid) return theme.primary;
          return "rgba(255, 120, 40, 0.08)";
        }}
        linkDirectionalParticles={(l) => {
          if (!hovered) return 0;
          const { source, target } = l as { source: string | { id: string }; target: string | { id: string } };
          const sid = linkEndpointId(source);
          const tid = linkEndpointId(target);
          return hovered.id === sid || hovered.id === tid ? 4 : 0;
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
      </Suspense>
    </div>
  );
}