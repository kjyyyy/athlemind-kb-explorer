"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { GraphAtmosphere } from "./GraphAtmosphere";
import { Graph2DView } from "./Graph2DView";
import { Graph3D } from "./Graph3D";
import { GraphLegend } from "./GraphLegend";
import { GraphToolbar } from "./GraphToolbar";
import { useKbClient } from "../KbClientProvider";
import { enrichGraph, topicLegend } from "../lib/graph-model";
import type { GraphEdge, GraphNode, PaperHit } from "../lib/types";

export type GraphMode = "overview" | "neighbourhood" | "entities";

type Props = {
  highlightWorkIds: string[];
  focusWorkId: string | null;
  onSelectWork: (id: string) => void;
  onFocusWork: (id: string) => void;
  onResetFocus?: () => void;
};

type GraphMeta = {
  warming: boolean;
  error: string | null;
  hint: string | null;
};

export function GraphPanel({
  highlightWorkIds,
  focusWorkId,
  onSelectWork,
  onFocusWork,
}: Props) {
  const kb = useKbClient();
  const [picked, setPicked] = useState<PaperHit | null>(null);
  const [mode, setMode] = useState<GraphMode>("overview");
  const [topic, setTopic] = useState("");
  const [entity, setEntity] = useState("");
  const [depth, setDepth] = useState(1);
  const [use3D, setUse3D] = useState(true);
  const [searchFlyId, setSearchFlyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<GraphMeta>({ warming: false, error: null, hint: null });
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [resetToken, setResetToken] = useState(0);

  const citationWorkId =
    mode === "neighbourhood" ? (focusWorkId ?? highlightWorkIds[0] ?? "") : "";
  const load = useCallback(async () => {
    setLoading(true);
    setMeta({ warming: false, error: null, hint: null });

    if (mode === "neighbourhood" && !citationWorkId) {
      setNodes([]);
      setEdges([]);
      setMeta({
        warming: false,
        error: null,
        hint: "Start typing a paper title above to explore who it cites and who cites it.",
      });
      setLoading(false);
      return;
    }

    try {
      const data = await kb.getGraph({
        mode,
        topic: mode === "overview" ? topic || undefined : undefined,
        workId: mode === "neighbourhood" ? citationWorkId : undefined,
        depth: mode === "neighbourhood" ? depth : undefined,
        entity: mode === "entities" ? entity || undefined : undefined,
        limit: 80,
      });

      if (data.error) {
        setNodes([]);
        setEdges([]);
        setMeta({
          warming: false,
          error: data.error ?? "Could not load graph data.",
          hint: null,
        });
        setLoading(false);
        return;
      }

      setNodes(data.nodes ?? []);
      setEdges(data.edges ?? []);

      let hint: string | null = data.hint ?? null;
      if (data.entities_unavailable) {
        hint =
          data.message ??
          "Entity triples are not available yet. Stay on Topics or run triple extraction on the KB.";
      } else if (mode === "entities" && (data.nodes?.length ?? 0) === 0) {
        hint =
          "No relations found for this entity. Pick another from the search list.";
      } else if (mode === "overview" && (data.nodes?.length ?? 0) === 0 && topic) {
        hint = `No papers found for the topic “${topic}”. Pick another from the search list.`;
      } else if (mode === "neighbourhood" && (data.edges?.length ?? 0) === 0) {
        hint = "This paper has no citation links in the library yet — try another one.";
      }

      setMeta({
        warming: Boolean(data.warming),
        error: null,
        hint,
      });
    } catch {
      setNodes([]);
      setEdges([]);
      setMeta({ warming: false, error: "Network error while loading the graph.", hint: null });
    }
    setLoading(false);
  }, [citationWorkId, depth, entity, kb, mode, topic]);

  useEffect(() => {
    void load();
  }, [load]);

  const highlight = useMemo(() => new Set(highlightWorkIds), [highlightWorkIds]);
  const graphData = useMemo(
    () => enrichGraph(nodes, edges, highlight),
    [nodes, edges, highlight],
  );
  const legend = useMemo(() => topicLegend(graphData.nodes), [graphData.nodes]);

  const resetView = useCallback(() => {
    setSearchFlyId(null);
    setResetToken((t) => t + 1);
  }, []);

  return (
    <section className="graph-stage">
      <GraphAtmosphere />
      <GraphToolbar
        mode={mode}
        setMode={setMode}
        topic={topic}
        setTopic={setTopic}
        entity={entity}
        setEntity={setEntity}
        onFindPaper={(p) => {
          setSearchFlyId(p.id);
          onSelectWork(p.id);
        }}
        use3D={use3D}
        setUse3D={setUse3D}
        onRefresh={load}
        onResetView={resetView}
        selectedPaperTitle={
          picked?.id === citationWorkId
            ? picked.title
            : (nodes.find((n) => n.id === citationWorkId)?.title ?? null)
        }
        onPickPaper={(p) => {
          setPicked(p);
          onFocusWork(p.id);
        }}
      />
      <GraphLegend items={legend} />
      {meta.warming && (
        <p className="graph-status">Models warming up — graph may be empty briefly.</p>
      )}
      {meta.error && <p className="graph-status graph-status--error">{meta.error}</p>}
      {loading && <p className="graph-status">Loading graph…</p>}
      {!loading && meta.hint && <p className="graph-status graph-status--hint">{meta.hint}</p>}
      {!loading && !meta.error && graphData.nodes.length === 0 && !meta.hint && (
        <p className="graph-status">No nodes in this view. Try Refresh or another mode.</p>
      )}
      {!loading &&
        graphData.nodes.length > 0 &&
        !(mode === "neighbourhood" && graphData.links.length === 0) && (
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