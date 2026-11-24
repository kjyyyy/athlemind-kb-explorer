import type { GraphEdge, GraphNode } from "@/lib/types";
import { TOPIC_PALETTE, paletteColor, readThemeColors } from "@/lib/theme";

export type EnrichedNode = GraphNode & {
  name: string;
  color: string;
  val: number;
  topicKey?: string;
  degree: number;
  x?: number;
  y?: number;
  z?: number;
};

export type ForceGraphData = {
  nodes: EnrichedNode[];
  links: Array<GraphEdge & { source: string; target: string }>;
};

function cleanLabel(label: string): string {
  return label.replace(/["“”]/g, "").replace(/\s+/g, " ").trim();
}

export function enrichGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  highlightIds: Set<string>,
): ForceGraphData {
  const theme = readThemeColors();
  const degree = new Map<string, number>();
  const neighbors = new Map<string, Set<string>>();

  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    if (!neighbors.has(e.source)) neighbors.set(e.source, new Set());
    if (!neighbors.has(e.target)) neighbors.set(e.target, new Set());
    neighbors.get(e.source)!.add(e.target);
    neighbors.get(e.target)!.add(e.source);
  }

  const topicColor = new Map<string, string>();
  let topicIdx = 0;
  for (const n of nodes) {
    if (n.type === "topic") {
      const key = n.label ?? n.id;
      if (!topicColor.has(key)) {
        const slot = TOPIC_PALETTE[topicIdx % TOPIC_PALETTE.length];
        topicColor.set(key, paletteColor(theme, slot));
        topicIdx += 1;
      }
    }
  }

  const workTopic = new Map<string, string>();
  for (const e of edges) {
    if (e.kind === "has_work") {
      workTopic.set(e.target, e.source);
    }
  }

  const enriched: EnrichedNode[] = nodes.map((raw) => {
    const n = raw.type === "entity" && raw.label ? { ...raw, label: cleanLabel(raw.label) } : raw;
    const name = n.label ?? n.title ?? n.id;
    const deg = degree.get(n.id) ?? 0;
    const cited = Math.log10((n.cited_by_count ?? 0) + 1);
    let color = theme.success;
    let topicKey: string | undefined;
    if (n.type === "topic") {
      color = topicColor.get(n.label ?? n.id) ?? theme.info;
      topicKey = n.label ?? n.id;
    } else if (n.type === "entity") {
      color = theme.warning;
    } else if (highlightIds.has(n.id)) {
      color = theme.primary;
    } else {
      const parent = workTopic.get(n.id);
      if (parent) {
        const topicNode = nodes.find((t) => t.id === parent);
        const label = topicNode?.label ?? topicNode?.id ?? parent;
        color = topicColor.get(label) ?? theme.dv2;
        topicKey = label;
      } else {
        color = theme.dv2;
      }
    }
    const base = n.type === "topic" ? 8 : 3;
    const val = base + cited * 2 + Math.min(deg, 12) * 0.35;
    return { ...n, name, color, val, topicKey, degree: deg };
  });

  return {
    nodes: enriched,
    links: edges.map((e) => ({ ...e, source: e.source, target: e.target })),
  };
}

export function neighbourSet(nodeId: string | null, edges: GraphEdge[]): Set<string> {
  if (!nodeId) return new Set();
  const set = new Set<string>([nodeId]);
  for (const e of edges) {
    if (e.source === nodeId) set.add(e.target);
    if (e.target === nodeId) set.add(e.source);
  }
  return set;
}

export function topicLegend(nodes: EnrichedNode[]): Array<{ label: string; color: string }> {
  const seen = new Map<string, string>();
  for (const n of nodes) {
    if (n.type === "topic" && n.label) {
      seen.set(n.label, n.color);
    }
  }
  return [...seen.entries()].map(([label, color]) => ({ label, color }));
}