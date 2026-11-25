"use client";

import { useState } from "react";

import { ChatPanel, GraphPanel, KbClientProvider, WorkDrawer } from "@athlemind/kb-ui";

import { nextKbClient } from "@/lib/kb-client";

export default function Home() {
  const [highlight, setHighlight] = useState<string[]>([]);
  const [focusWorkId, setFocusWorkId] = useState<string | null>(null);
  const [selectedWork, setSelectedWork] = useState<string | null>(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  return (
    <KbClientProvider client={nextKbClient} config={{ pollMs: 1500, maxWaitMs: 90_000 }}>
      <main className={`explorer kb-ui ${chatCollapsed ? "explorer--chat-collapsed" : ""}`}>
        <ChatPanel
          collapsed={chatCollapsed}
          onToggleCollapse={() => setChatCollapsed((c) => !c)}
          onSources={setHighlight}
          onFocusCitation={setFocusWorkId}
          onOpenWork={(workId) => {
            setFocusWorkId(workId);
            setSelectedWork(workId);
          }}
        />
        <GraphPanel
          highlightWorkIds={highlight}
          answerWorkIds={highlight}
          focusWorkId={focusWorkId}
          onSelectWork={(workId) => {
            setSelectedWork(workId);
            setFocusWorkId(workId);
          }}
          onFocusWork={setFocusWorkId}
        />
        <WorkDrawer workId={selectedWork} onClose={() => setSelectedWork(null)} />
      </main>
    </KbClientProvider>
  );
}