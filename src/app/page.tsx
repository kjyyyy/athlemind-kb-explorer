"use client";

import { useState } from "react";

import { ChatPanel } from "@/components/ChatPanel";
import { GraphPanel } from "@/components/GraphPanel";
import { WorkDrawer } from "@/components/WorkDrawer";

export default function Home() {
  const [highlight, setHighlight] = useState<string[]>([]);
  const [focusWorkId, setFocusWorkId] = useState<string | null>(null);
  const [selectedWork, setSelectedWork] = useState<string | null>(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  return (
    <main className={`explorer ${chatCollapsed ? "explorer--chat-collapsed" : ""}`}>
      <ChatPanel
        collapsed={chatCollapsed}
        onToggleCollapse={() => setChatCollapsed((c) => !c)}
        onSources={setHighlight}
        onFocusCitation={(workId) => {
          setFocusWorkId(workId);
          setSelectedWork(workId);
        }}
      />
      <GraphPanel
        highlightWorkIds={highlight}
        focusWorkId={focusWorkId}
        onSelectWork={(workId) => {
          setSelectedWork(workId);
          setFocusWorkId(workId);
        }}
        onFocusWork={setFocusWorkId}
      />
      <WorkDrawer workId={selectedWork} onClose={() => setSelectedWork(null)} />
    </main>
  );
}