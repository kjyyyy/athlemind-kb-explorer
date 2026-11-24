"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { GraphEdge, GraphNode } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type Props = {
  highlightWorkIds: string[];
  onSelectWork: (id: string) => void;
};

type GraphMode = "overview" | "neighbourhood" | "entities";

export function GraphPanel({ highlightWorkIds, onSelectWork }: Props) {
  const [mode, setMode] = useState<GraphMode>("overview");
  const [topic, setTopic] = useState("");
  const [workId, setWorkId] = useState("");
  const [depth, setDepth] = useState(1);
  const [loading, setLoading] = useState(true);
  const [warming, setWarming] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ mode });
    if (mode === "overview" && topic) params.set("topic", topic);
    if (mode === "neighbourhood") {
      if (workId) params.set("work_id", workId);
      params.set("depth", String(depth));
    }
    if (mode === "entities" && topic) params.set("q", topic);
    const res = await fetch(`/api/graph?${params}`);
    const data = await res.json();
    setWarming(Boolean(data.warming));
    setNodes(data.nodes ?? []);
    setEdges(data.edges ?? []);
    setLoading(false);
  }, [depth, mode, topic, workId]);

  useEffect(() => {
    void load();
  }, [load]);

  const graphData = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ ...n, name: n.label ?? n.title ?? n.id })),
      links: edges.map((e) => ({ ...e, source: e.source, target: e.target })),
    }),
    [nodes, edges],
  );

  const highlight = useMemo(() => new Set(highlightWorkIds), [highlightWorkIds]);

  return (
    <section className="graph-pane">
      <header className="graph-toolbar">
        <h2>Knowledge graph</h2>
        <GraphControls
          mode={mode}
          setMode={setMode}
          topic={topic}
          setTopic={setTopic}
          workId={workId}
          setWorkId={setWorkId}
          depth={depth}
          setDepth={setDepth}
          onRefresh={load}
        />
      </header>
      {warming && <p className="warming">Models warming up — graph may be empty briefly.</p>}
      {loading && <p className="warming">Loading graph…</p>}
      <div className="graph-canvas">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel={(n) => {
            const gn = n as GraphNode & { name?: string };
            return gn.name ?? gn.label ?? gn.title ?? gn.id;
          }}
          linkLabel={(l) => String((l as GraphEdge).kind ?? "")}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          onNodeClick={(n) => {
            const node = n as GraphNode;
            if (node.type === "work" || (!node.type && node.id.length === 36)) {
              onSelectWork(node.id);
            }
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GraphNode & { x?: number; y?: number };
            const label = n.label ?? n.title ?? n.id;
            const fontSize = 12 / globalScale;
            const isHl = highlight.has(n.id);
            const type = n.type ?? "work";
            const fill =
              type === "topic"
                ? "#3A7CC4"
                : type === "entity"
                  ? "#B07A2A"
                  : isHl
                    ? "#FF5C00"
                    : "#2A9D6A";
            const r = type === "topic" ? 10 : 6;
            if (n.x == null || n.y == null) return;
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = fill;
            ctx.fill();
            if (isHl) {
              ctx.strokeStyle = "#E24D00";
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }
            ctx.font = `${fontSize}px var(--font-ui)`;
            ctx.fillStyle = "#1A1108";
            ctx.fillText(label.slice(0, 42), n.x + r + 2, n.y + 4);
          }}
        />
      </div>
    </section>
  );
}

type ToolbarProps = {
  mode: GraphMode;
  setMode: (m: GraphMode) => void;
  topic: string;
  setTopic: (s: string) => void;
  workId: string;
  setWorkId: (s: string) => void;
  depth: number;
  setDepth: (n: number) => void;
  onRefresh: () => void;
};

function GraphControls({
  mode,
  setMode,
  topic,
  setTopic,
  workId,
  setWorkId,
  depth,
  setDepth,
  onRefresh,
}: ToolbarProps) {
  return (
    <div className="graph-controls">
      <label>
        Mode
        <select value={mode} onChange={(e) => setMode(e.target.value as GraphMode)}>
          <option value="overview">Topics</option>
          <option value="neighbourhood">Citations</option>
          <option value="entities">Entities</option>
        </select>
      </label>
      {mode === "overview" && (
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Filter topic…"
        />
      )}
      {mode === "neighbourhood" && (
        <>
          <input
            value={workId}
            onChange={(e) => setWorkId(e.target.value)}
            placeholder="Work UUID…"
          />
          <label>
            Depth
            <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </label>
        </>
      )}
      {mode === "entities" && (
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Entity search…" />
      )}
      <button type="button" onClick={onRefresh}>
        Refresh
      </button>
    </div>
  );
}