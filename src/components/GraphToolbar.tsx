"use client";

import type { GraphMode } from "@/components/GraphPanel";
import { PaperPicker } from "@/components/PaperPicker";
import { SearchCombobox } from "@/components/SearchCombobox";
import { searchEntities, searchPapers, searchTopics } from "@/lib/typeahead";
import type { PaperHit } from "@/lib/types";

type TopicOrPaper = { kind: "topic"; label: string } | { kind: "paper"; paper: PaperHit };

type Props = {
  selectedPaperTitle: string | null;
  onPickPaper: (paper: PaperHit) => void;
  onFindPaper: (paper: PaperHit) => void;
  mode: GraphMode;
  setMode: (m: GraphMode) => void;
  topic: string;
  setTopic: (s: string) => void;
  entity: string;
  setEntity: (s: string) => void;
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
  entity,
  setEntity,
  use3D,
  setUse3D,
  onRefresh,
  onResetView,
  selectedPaperTitle,
  onPickPaper,
  onFindPaper,
}: Props) {
  return (
    <div className="graph-float-toolbar">
      {mode === "neighbourhood" && (
        <PaperPicker selectedTitle={selectedPaperTitle} onPick={onPickPaper} />
      )}
      {mode === "overview" && (
        <SearchCombobox<TopicOrPaper>
          fetchItems={async (q, signal) => {
            const [topics, papers] = await Promise.all([
              searchTopics(q, 6, signal),
              q ? searchPapers(q, 5, signal) : Promise.resolve([]),
            ]);
            return [
              ...topics.map((t) => ({
                key: `topic:${t.label}`,
                label: t.label,
                meta: `${t.papers} paper${t.papers === 1 ? "" : "s"}`,
                group: "Topics",
                value: { kind: "topic" as const, label: t.label },
              })),
              ...papers.map((p) => ({
                key: `paper:${p.id}`,
                label: p.title,
                meta: `${p.year ?? "n.d."} · cited by ${p.cited_by_count ?? 0}`,
                group: "Papers",
                value: { kind: "paper" as const, paper: p },
              })),
            ];
          }}
          onPick={({ value }) =>
            value.kind === "topic" ? setTopic(value.label) : onFindPaper(value.paper)
          }
          onSubmitText={setTopic}
          placeholder="Search topics or papers…"
          ariaLabel="Search topics or papers"
          emptyQueryNote="Largest topics"
          noun="topics or papers"
        />
      )}
      {mode === "entities" && (
        <SearchCombobox<string>
          fetchItems={async (q, signal) =>
            (await searchEntities(q, 10, signal)).map((e) => ({
              key: e.label.toLowerCase(),
              label: e.label,
              meta: `${e.mentions} relation${e.mentions === 1 ? "" : "s"}`,
              value: e.label,
            }))
          }
          onPick={({ value }) => setEntity(value)}
          onSubmitText={setEntity}
          placeholder="Search entities (e.g. anxiety)…"
          ariaLabel="Search entities"
          emptyQueryNote="Most-connected entities"
          noun="entities"
        />
      )}
      {mode === "overview" && topic && (
        <FilterChip label="Topic" value={topic} onClear={() => setTopic("")} />
      )}
      {mode === "entities" && entity && (
        <FilterChip label="Entity" value={entity} onClear={() => setEntity("")} />
      )}
      <label className="graph-toolbar-field">
        <span>Mode</span>
        <select value={mode} onChange={(e) => setMode(e.target.value as GraphMode)}>
          <option value="overview">Topics</option>
          <option value="neighbourhood">Citations</option>
          <option value="entities">Entities</option>
        </select>
      </label>
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

function FilterChip({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <span className="graph-filter-chip" title={value}>
      <span className="graph-filter-chip-label">{label}:</span>
      <span className="graph-filter-chip-value">{value}</span>
      <button type="button" onClick={onClear} aria-label={`Clear ${label.toLowerCase()} filter`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
