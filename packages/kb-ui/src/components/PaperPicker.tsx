"use client";

import { useKbClient } from "../KbClientProvider";
import { SearchCombobox } from "./SearchCombobox";
import type { PaperHit } from "../lib/types";

type Props = {
  selectedTitle: string | null;
  onPick: (paper: PaperHit) => void;
};

export function PaperPicker({ selectedTitle, onPick }: Props) {
  const kb = useKbClient();
  return (
    <SearchCombobox<PaperHit>
      fetchItems={async (q, signal) => {
        const hits = await kb.searchWorks(q, 10, signal);
        return [...hits.filter((p) => p.links > 0), ...hits.filter((p) => p.links === 0)].map(
          (p) => ({
            key: p.id,
            label: p.title,
            meta: `${p.year ?? "n.d."} · ${p.links} citation link${p.links === 1 ? "" : "s"}`,
            value: p,
          }),
        );
      }}
      onPick={(item) => onPick(item.value)}
      placeholder={selectedTitle ? `${selectedTitle} — type to change` : "Type a paper title…"}
      title={selectedTitle ?? undefined}
      ariaLabel="Choose a paper to explore its citations"
      emptyQueryNote="Most-cited papers"
      noun="papers"
    />
  );
}
