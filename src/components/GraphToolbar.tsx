"use client";

import type { GraphMode } from "@/components/GraphPanel";

type Props = {
  mode: GraphMode;
  setMode: (m: GraphMode) => void;
  topic: string;
  setTopic: (s: string) => void;
  search: string;
  setSearch: (s: string) => void;
  use3D: boolean;
  setUse3D: (v: boolean) => void;
  onRefresh: () => void;
  onResetView: () => void;
};

export function GraphToolbar({
  mode,
  setMode,
  topic,
  setTopic,
  search,
  setSearch,
  use3D,
  setUse3D,
  onRefresh,
  onResetView,
}: Props) {
  return (
    <div className="graph-float-toolbar">
      <input
        className="graph-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={
          mode === "entities"
            ? "Filter entities (subject/object)…"
            : "Find paper, topic, or entity…"
        }
        aria-label="Search graph"
      />
      <label className="graph-toolbar-field">
        <span>Mode</span>
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
          className="graph-filter"
        />
      )}
      <button type="button" className="graph-tool-btn" onClick={() => setUse3D(!use3D)}>
        {use3D ? "2D" : "3D"}
      </button>
      <button type="button" className="graph-tool-btn" onClick={onResetView}>
        Reset view
      </button>
      <button type="button" className="graph-tool-btn graph-tool-btn--primary" onClick={onRefresh}>
        Refresh
      </button>
    </div>
  );
}