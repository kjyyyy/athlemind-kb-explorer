"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Graph2DView } from "@/components/Graph2DView";
import { Graph3D } from "@/components/Graph3D";
import { GraphLegend } from "@/components/GraphLegend";
import { GraphToolbar } from "@/components/GraphToolbar";
import { enrichGraph, searchNodes, topicLegend } from "@/lib/graph-model";
import type { GraphEdge, GraphNode } from "@/lib/types";

export type GraphMode = "overview" | "neighbourhood" | "entities";

type Props = {
  highlightWorkIds: string[];
  focusWorkId: string | null;
  onSelectWork: (id: string) => void;
  onResetFocus?: () => void;
};

export function GraphPanel({
  highlightWorkIds,
  focusWorkId,
  onSelectWork,
}: Props) {
  const [mode, setMode] = useState<GraphMode>("overview");
  const [topic, setTopic] = useState("");
  const [workId, setWorkId] = useState("");
  const [depth, setDepth] = useState(1);
  const [search, setSearch] = useState("");
  const [use3D, setUse3D] = useState(true);
  const [searchFlyId, setSearchFlyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [warming, setWarming] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [resetToken, setResetToken] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ mode });
    if (mode === "overview") {
      if (topic) params.set("topic", topic);
      params.set("limit", "80");
    }
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

  const highlight = useMemo(() => new Set(highlightWorkIds), [highlightWorkIds]);
  const graphData = useMemo(
    () => enrichGraph(nodes, edges, highlight),
    [nodes, edges, highlight],
  );
  const legend = useMemo(() => topicLegend(graphData.nodes), [graphData.nodes]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSearchFlyId(null);
      return;
    }
    const hit = searchNodes(graphData.nodes, q, 1)[0];
    if (hit) setSearchFlyId(hit.id);
  }, [graphData.nodes, search]);

  const resetView = useCallback(() => {
    setSearchFlyId(null);
    setResetToken((t) => t + 1);
  }, []);

  return (
    <section className="graph-stage">
      <GraphToolbar
        mode={mode}
        setMode={setMode}
        topic={topic}
        setTopic={setTopic}
        search={search}
        setSearch={setSearch}
        use3D={use3D}
        setUse3D={setUse3D}
        onRefresh={load}
        onResetView={resetView}
      />
      <GraphLegend items={legend} />
      {warming && <p className="graph-status">Models warming up — graph may be empty briefly.</p>}
      {loading && <p className="graph-status">Loading graph…</p>}
      {!loading && graphData.nodes.length === 0 && (
        <p className="graph-status">No nodes in this view. Try Refresh or another mode.</p>
      )}
      {!loading && graphData.nodes.length > 0 && (
        <>
          {use3D ? (
            <Graph3D
              key={`3d-${resetToken}`}
              data={graphData}
              highlightWorkIds={highlightWorkIds}
              focusWorkId={focusWorkId}
              searchFlyId={searchFlyId}
              onSelectWork={onSelectWork}
            />
          ) : (
            <Graph2DView
              data={graphData}
              highlightWorkIds={highlightWorkIds}
              onSelectWork={onSelectWork}
            />
          )}
        </>
      )}
    </section>
  );
}