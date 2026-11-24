"use client";

import { useState } from "react";

import { ChatPanel } from "@/components/ChatPanel";
import { GraphPanel } from "@/components/GraphPanel";
import { WorkDrawer } from "@/components/WorkDrawer";

export default function Home() {
  const [highlight, setHighlight] = useState<string[]>([]);
  const [selectedWork, setSelectedWork] = useState<string | null>(null);

  return (
    <main className="shell">
      <ChatPanel onSources={setHighlight} />
      <GraphPanel highlightWorkIds={highlight} onSelectWork={setSelectedWork} />
      <WorkDrawer workId={selectedWork} onClose={() => setSelectedWork(null)} />
    </main>
  );
}