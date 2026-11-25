// src/components/ChatPanel.tsx
import { useMemo as useMemo2, useState as useState2 } from "react";

// src/KbClientProvider.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var ClientCtx = createContext(null);
var ConfigCtx = createContext({});
function KbClientProvider({
  client,
  config,
  children
}) {
  return /* @__PURE__ */ jsx(ClientCtx.Provider, { value: client, children: /* @__PURE__ */ jsx(ConfigCtx.Provider, { value: config ?? {}, children }) });
}
function useKbClient() {
  const client = useContext(ClientCtx);
  if (!client) throw new Error("useKbClient requires KbClientProvider");
  return client;
}
function useKbClientConfig() {
  return useContext(ConfigCtx);
}

// src/components/ChatProgress.tsx
import { useEffect, useRef, useState } from "react";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var STAGE_LABEL = {
  queued: "Understanding your question",
  embedding: "Understanding your question",
  searching: "Searching the library",
  reranking: "Ranking the best evidence",
  writing: "Writing a cited answer",
  done: "Done"
};
var STAGE_CEILING = {
  queued: 9,
  embedding: 28,
  searching: 53,
  reranking: 73,
  writing: 96,
  done: 100
};
var SLOW_AFTER_S = 45;
function ChatProgress({ stage, progress, startedAt, state }) {
  const [shown, setShown] = useState(progress);
  const [elapsed, setElapsed] = useState(0);
  const reduceMotion = useRef(false);
  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  useEffect(() => {
    if (state === "done") {
      setShown(100);
      return;
    }
    setShown((s) => Math.max(s, progress));
    if (state !== "loading") return;
    const ceiling = STAGE_CEILING[stage];
    const id = window.setInterval(() => {
      setShown((s) => {
        const floor = Math.max(s, progress);
        if (reduceMotion.current) return floor;
        return floor + Math.max(0, ceiling - floor) * 0.035;
      });
      setElapsed(Math.floor((Date.now() - startedAt) / 1e3));
    }, 200);
    return () => window.clearInterval(id);
  }, [progress, stage, startedAt, state]);
  const label = state === "error" ? "Something went wrong" : STAGE_LABEL[stage];
  const pct = Math.round(Math.min(100, shown));
  return /* @__PURE__ */ jsxs("div", { className: `chat-progress chat-progress--${state}`, children: [
    /* @__PURE__ */ jsx2(
      "div",
      {
        className: "chat-progress-track",
        role: "progressbar",
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": pct,
        "aria-valuetext": label,
        children: /* @__PURE__ */ jsx2("div", { className: "chat-progress-fill", style: { transform: `scaleX(${shown / 100})` } })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "chat-progress-label", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        label,
        "\u2026"
      ] }),
      state === "loading" && /* @__PURE__ */ jsxs("span", { className: "chat-progress-meta", children: [
        elapsed > SLOW_AFTER_S ? "Taking longer than usual \xB7 " : "",
        elapsed,
        "s"
      ] })
    ] })
  ] });
}

// src/components/SourceList.tsx
import { useMemo } from "react";

// src/lib/licence.ts
var TIER_LABEL = {
  open_full: "Open access",
  open_restricted: "Open access \xB7 restricted reuse",
  facts_only: "Abstract only",
  metadata_only: "Citation only"
};
function tierLabel(tier) {
  if (!tier) return void 0;
  return TIER_LABEL[tier] ?? tier.replace(/_/g, " ");
}

// src/components/SourceList.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function citedNumbers(text) {
  return new Set([...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
}
function passageDomId(messageKey, n) {
  return `src-${messageKey}-${n}`;
}
function groupByPaper(sources, cited) {
  const groups = /* @__PURE__ */ new Map();
  sources.forEach((source, i) => {
    const n = i + 1;
    let g = groups.get(source.work_id);
    if (!g) {
      g = { workId: source.work_id, title: source.title, tier: source.licence_tier, passages: [], cited: false };
      groups.set(source.work_id, g);
    }
    g.passages.push({ n, source, cited: cited.has(n) });
    g.cited ||= cited.has(n);
  });
  return [...groups.values()].sort((a, b) => Number(b.cited) - Number(a.cited));
}
function SourceList({ messageKey, answer, sources, onFocusCitation, onOpenWork }) {
  const groups = useMemo(() => groupByPaper(sources, citedNumbers(answer)), [sources, answer]);
  const firstUncited = groups.findIndex((g) => !g.cited);
  return /* @__PURE__ */ jsxs2("section", { className: "sources", "aria-label": "Sources", children: [
    /* @__PURE__ */ jsxs2("h2", { className: "sources-heading", children: [
      "Sources \xB7 ",
      groups.length,
      " ",
      groups.length === 1 ? "paper" : "papers"
    ] }),
    /* @__PURE__ */ jsx3("ol", { className: "source-groups", children: groups.map((g, gi) => /* @__PURE__ */ jsxs2("li", { children: [
      gi === firstUncited && gi > 0 && /* @__PURE__ */ jsx3("p", { className: "sources-subheading", children: "Also retrieved" }),
      /* @__PURE__ */ jsxs2("div", { className: `source-group${g.cited ? "" : " source-group--muted"}`, children: [
        /* @__PURE__ */ jsx3(
          "button",
          {
            type: "button",
            className: "source-group-title",
            onClick: () => onOpenWork(g.workId),
            title: "Open paper details",
            children: g.title
          }
        ),
        /* @__PURE__ */ jsxs2("div", { className: "source-group-meta", children: [
          /* @__PURE__ */ jsx3("span", { className: "tier", children: tierLabel(g.tier) }),
          /* @__PURE__ */ jsx3("span", { className: "source-chips", children: g.passages.map((p) => /* @__PURE__ */ jsxs2(
            "button",
            {
              type: "button",
              className: `cite-chip${p.cited ? "" : " cite-chip--uncited"}`,
              onClick: () => {
                onFocusCitation(g.workId);
                revealPassage(messageKey, p.n);
              },
              title: p.cited ? `Passage ${p.n} (cited)` : `Passage ${p.n}`,
              children: [
                "[",
                p.n,
                "]"
              ]
            },
            p.n
          )) })
        ] }),
        g.passages.some((p) => p.source.snippet) && /* @__PURE__ */ jsxs2("details", { className: "source-passages", children: [
          /* @__PURE__ */ jsxs2("summary", { children: [
            "Show ",
            g.passages.length,
            " ",
            g.passages.length === 1 ? "passage" : "passages"
          ] }),
          /* @__PURE__ */ jsx3("ol", { children: g.passages.map(
            (p) => p.source.snippet && /* @__PURE__ */ jsxs2("li", { id: passageDomId(messageKey, p.n), className: "source-passage", children: [
              /* @__PURE__ */ jsxs2("span", { className: "cite-chip", children: [
                "[",
                p.n,
                "]"
              ] }),
              /* @__PURE__ */ jsxs2("span", { children: [
                p.source.snippet.slice(0, 220).trim(),
                "\u2026"
              ] })
            ] }, p.n)
          ) })
        ] })
      ] })
    ] }, g.workId)) })
  ] });
}
function revealPassage(messageKey, n) {
  const el = document.getElementById(passageDomId(messageKey, n));
  if (!el) return;
  const details = el.closest("details");
  if (details) details.open = true;
  el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  el.classList.remove("source-passage--flash");
  void el.offsetWidth;
  el.classList.add("source-passage--flash");
}

// src/components/ChatPanel.tsx
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var FADE_MS = 350;
var ERROR_TEXT = {
  rate_limited: "You're asking quickly \u2014 please wait a few seconds and try again.",
  warming: "The knowledge base is starting up. Please try again in a minute.",
  timeout: "The answer took too long. Please try again.",
  job_lost: "The server restarted while answering. Please ask again.",
  invalid_request: "That question couldn't be sent. Try rephrasing it.",
  network: "Couldn't reach the server. Check your connection and try again."
};
var FALLBACK_ERROR = "Something went wrong answering that. Please try again.";
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
var SUGGESTIONS = [
  "Does cold water immersion help recovery?",
  "How does sleep affect athletic performance?",
  "What is the evidence on training load monitoring?"
];
function ChatPanel({
  collapsed,
  onToggleCollapse,
  onSources,
  onFocusCitation,
  onOpenWork,
  onExchangeComplete
}) {
  const kb = useKbClient();
  const kbCfg = useKbClientConfig();
  const [input, setInput] = useState2("");
  const [loading, setLoading] = useState2(false);
  const [messages, setMessages] = useState2([]);
  const [progress, setProgress] = useState2(null);
  function fail(code) {
    setProgress((p) => p ? { ...p, state: "error" } : p);
    setMessages((m) => [
      ...m,
      { role: "assistant", text: code && ERROR_TEXT[code] || FALLBACK_ERROR }
    ]);
  }
  async function runJob(q) {
    const created = await kb.createEvidenceJob({ query: q, limit: 8 });
    if (!created.job_id) return created.error ?? "unavailable";
    const deadline = Date.now() + (kbCfg.maxWaitMs ?? 9e4);
    const pollMs = kbCfg.pollMs ?? 1500;
    while (Date.now() < deadline) {
      await sleep(pollMs);
      const status = await kb.getEvidenceJob(created.job_id);
      if (status.error === "rate_limited") continue;
      if (status.error) return status.error;
      if (status.status === "error") return "failed";
      setProgress((p) => p ? { ...p, stage: status.stage, progress: status.progress } : p);
      if (status.status === "done" && status.result) return status.result;
    }
    return "timeout";
  }
  async function ask(q) {
    if (!q.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    setProgress({ stage: "queued", progress: 5, startedAt: Date.now(), state: "loading" });
    try {
      const outcome = await runJob(q);
      if (typeof outcome === "string") {
        fail(outcome);
        await sleep(700);
        return;
      }
      setProgress((p) => p ? { ...p, stage: "done", progress: 100, state: "done" } : p);
      await sleep(FADE_MS);
      onSources(outcome.sources?.map((s) => s.work_id) ?? []);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: outcome.answer,
          sources: outcome.sources,
          queryId: outcome.query_id
        }
      ]);
      onExchangeComplete?.(q, outcome);
    } catch {
      fail("network");
    } finally {
      setProgress(null);
      setLoading(false);
    }
  }
  function submit(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput("");
    void ask(q);
  }
  async function submitFeedback(index, rating) {
    const msg = messages[index];
    if (!msg?.queryId || msg.feedback === rating) return;
    setMessages((m) => m.map((row, i) => i === index ? { ...row, feedback: rating } : row));
    const res = await kb.submitEvidenceFeedback(msg.queryId, { rating });
    if (res.error) {
      setMessages((m) => m.map((row, i) => i === index ? { ...row, feedback: void 0 } : row));
    }
  }
  if (collapsed) {
    return /* @__PURE__ */ jsx4("aside", { className: "chat-rail", children: /* @__PURE__ */ jsx4(
      "button",
      {
        type: "button",
        className: "chat-rail-btn",
        onClick: onToggleCollapse,
        "aria-expanded": false,
        "aria-label": "Show evidence chat",
        title: "Show evidence chat",
        children: /* @__PURE__ */ jsx4(PanelIcon, { open: false })
      }
    ) });
  }
  return /* @__PURE__ */ jsxs3("aside", { className: "chat-panel", children: [
    /* @__PURE__ */ jsxs3("header", { className: "chat-header", children: [
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsx4("h1", { children: "Evidence chat" }),
        /* @__PURE__ */ jsx4("p", { children: "Grounded answers from the sport psychology research library." })
      ] }),
      /* @__PURE__ */ jsx4(
        "button",
        {
          type: "button",
          className: "chat-collapse",
          onClick: onToggleCollapse,
          "aria-expanded": true,
          "aria-label": "Hide evidence chat",
          title: "Hide evidence chat",
          children: /* @__PURE__ */ jsx4(PanelIcon, { open: true })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "chat-messages", "aria-live": "polite", children: [
      messages.length === 0 && /* @__PURE__ */ jsxs3("div", { className: "chat-empty", children: [
        /* @__PURE__ */ jsx4("p", { className: "chat-hint", children: "Try a suggested question:" }),
        /* @__PURE__ */ jsx4("div", { className: "suggestion-row", children: SUGGESTIONS.map((s) => /* @__PURE__ */ jsx4("button", { type: "button", className: "suggestion-chip", onClick: () => void ask(s), children: s }, s)) })
      ] }),
      messages.map((msg, i) => /* @__PURE__ */ jsxs3("article", { className: `bubble bubble-${msg.role}`, children: [
        msg.role === "assistant" ? /* @__PURE__ */ jsx4(
          AnswerBody,
          {
            text: msg.text,
            sources: msg.sources,
            onCite: (workId, n) => {
              onFocusCitation(workId);
              revealPassage(String(i), n);
            }
          }
        ) : /* @__PURE__ */ jsx4("p", { children: msg.text }),
        msg.sources && msg.sources.length > 0 && /* @__PURE__ */ jsx4(
          SourceList,
          {
            messageKey: String(i),
            answer: msg.text,
            sources: msg.sources,
            onFocusCitation,
            onOpenWork
          }
        ),
        msg.role === "assistant" && msg.queryId && /* @__PURE__ */ jsxs3("div", { className: "answer-feedback", "aria-label": "Rate this answer", children: [
          /* @__PURE__ */ jsx4("span", { className: "answer-feedback-label", children: "Helpful?" }),
          /* @__PURE__ */ jsx4(
            "button",
            {
              type: "button",
              className: `feedback-btn ${msg.feedback === "up" ? "is-active" : ""}`,
              "aria-pressed": msg.feedback === "up",
              "aria-label": "Thumbs up",
              onClick: () => void submitFeedback(i, "up"),
              children: "\u2191"
            }
          ),
          /* @__PURE__ */ jsx4(
            "button",
            {
              type: "button",
              className: `feedback-btn ${msg.feedback === "down" ? "is-active" : ""}`,
              "aria-pressed": msg.feedback === "down",
              "aria-label": "Thumbs down",
              onClick: () => void submitFeedback(i, "down"),
              children: "\u2193"
            }
          )
        ] })
      ] }, i)),
      progress && /* @__PURE__ */ jsx4(
        ChatProgress,
        {
          stage: progress.stage,
          progress: progress.progress,
          startedAt: progress.startedAt,
          state: progress.state
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3("form", { className: "chat-form", onSubmit: submit, children: [
      /* @__PURE__ */ jsx4(
        "input",
        {
          value: input,
          onChange: (e) => setInput(e.target.value),
          maxLength: 500,
          placeholder: "Your question\u2026",
          disabled: loading
        }
      ),
      /* @__PURE__ */ jsx4("button", { type: "submit", disabled: loading || !input.trim(), children: loading ? "Thinking\u2026" : "Ask" })
    ] }),
    /* @__PURE__ */ jsx4("p", { className: "chat-storage-notice", children: "Questions are stored to improve answers. Don't include personal information." })
  ] });
}
function PanelIcon({ open }) {
  return /* @__PURE__ */ jsxs3(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ jsx4("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
        /* @__PURE__ */ jsx4("path", { d: "M9 3v18" }),
        /* @__PURE__ */ jsx4("path", { d: open ? "m16 15-3-3 3-3" : "m14 9 3 3-3 3" })
      ]
    }
  );
}
function AnswerBody({
  text,
  sources,
  onCite
}) {
  const parts = useMemo2(() => text.split(/(\[\d+\])/g), [text]);
  return /* @__PURE__ */ jsx4("p", { className: "answer-body", children: parts.map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (m && sources) {
      const idx = Number(m[1]) - 1;
      const src = sources[idx];
      if (src) {
        return /* @__PURE__ */ jsx4(
          "button",
          {
            type: "button",
            className: "inline-cite",
            onClick: () => onCite(src.work_id, idx + 1),
            children: part
          },
          i
        );
      }
    }
    return /* @__PURE__ */ jsx4("span", { children: part }, i);
  }) });
}

// src/components/GraphPanel.tsx
import { useCallback as useCallback2, useEffect as useEffect4, useMemo as useMemo5, useRef as useRef4, useState as useState6 } from "react";

// src/components/GraphAtmosphere.tsx
import { Fragment, jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function GraphAtmosphere() {
  return /* @__PURE__ */ jsxs4(Fragment, { children: [
    /* @__PURE__ */ jsx5("div", { className: "graph-atmo-base", "aria-hidden": true }),
    /* @__PURE__ */ jsx5("div", { className: "graph-atmo-grid", "aria-hidden": true }),
    /* @__PURE__ */ jsx5("div", { className: "graph-atmo-glow graph-atmo-glow--brand", "aria-hidden": true }),
    /* @__PURE__ */ jsx5("div", { className: "graph-atmo-glow graph-atmo-glow--accent", "aria-hidden": true }),
    /* @__PURE__ */ jsx5("div", { className: "graph-atmo-vignette", "aria-hidden": true }),
    /* @__PURE__ */ jsx5("div", { className: "graph-atmo-noise", "aria-hidden": true })
  ] });
}

// src/components/Graph2DView.tsx
import { lazy, Suspense, useMemo as useMemo3, useState as useState3 } from "react";

// src/lib/theme.ts
var FALLBACK = {
  /** Near-black canvas — WebGL is transparent over CSS atmosphere */
  canvasVoid: "#060708",
  brandNavy: "#042848",
  primary: "#FF5C00",
  primaryHover: "#FF6F1F",
  ink: "#F5EFE7",
  inkMuted: "#A99C8D",
  info: "#6FA8E4",
  success: "#3FBD85",
  warning: "#D9A050",
  danger: "#E06A50",
  dv1: "#3FBD85",
  dv2: "#6FA8E4",
  dv3: "#9A7FD4",
  dv4: "#E06A50"
};
function readThemeColors() {
  if (typeof document === "undefined") return FALLBACK;
  const s = getComputedStyle(document.documentElement);
  const pick = (v, fb) => s.getPropertyValue(v).trim() || fb;
  return {
    canvasVoid: pick("--kb-canvas-void", FALLBACK.canvasVoid),
    brandNavy: pick("--brand-navy", FALLBACK.brandNavy),
    primary: pick("--primary", FALLBACK.primary),
    primaryHover: pick("--primary-hover", FALLBACK.primaryHover),
    ink: pick("--ink", FALLBACK.ink),
    inkMuted: pick("--ink-3", FALLBACK.inkMuted),
    info: pick("--info", FALLBACK.info),
    success: pick("--success", FALLBACK.success),
    warning: pick("--warning", FALLBACK.warning),
    danger: pick("--danger", FALLBACK.danger),
    dv1: pick("--dv-1", FALLBACK.dv1),
    dv2: pick("--dv-2", FALLBACK.dv2),
    dv3: pick("--dv-3", FALLBACK.dv3),
    dv4: pick("--dv-4", FALLBACK.dv4)
  };
}
var TOPIC_PALETTE = ["success", "warning", "primary", "dv4", "dv3", "danger"];
function paletteColor(theme, slot) {
  if (slot === "primary") return theme.primary;
  return theme[slot];
}

// src/lib/graph-model.ts
function cleanLabel(label) {
  return label.replace(/["“”]/g, "").replace(/\s+/g, " ").trim();
}
function enrichGraph(nodes, edges, highlightIds) {
  const theme = readThemeColors();
  const degree = /* @__PURE__ */ new Map();
  const neighbors = /* @__PURE__ */ new Map();
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    if (!neighbors.has(e.source)) neighbors.set(e.source, /* @__PURE__ */ new Set());
    if (!neighbors.has(e.target)) neighbors.set(e.target, /* @__PURE__ */ new Set());
    neighbors.get(e.source).add(e.target);
    neighbors.get(e.target).add(e.source);
  }
  const topicColor = /* @__PURE__ */ new Map();
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
  const workTopic = /* @__PURE__ */ new Map();
  for (const e of edges) {
    if (e.kind === "has_work") {
      workTopic.set(e.target, e.source);
    }
  }
  const enriched = nodes.map((raw) => {
    const n = raw.type === "entity" && raw.label ? { ...raw, label: cleanLabel(raw.label) } : raw;
    const name = n.label ?? n.title ?? n.id;
    const deg = degree.get(n.id) ?? 0;
    const cited = Math.log10((n.cited_by_count ?? 0) + 1);
    let color = theme.success;
    let topicKey;
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
    links: edges.map((e) => ({ ...e, source: e.source, target: e.target }))
  };
}
function neighbourSet(nodeId, edges) {
  if (!nodeId) return /* @__PURE__ */ new Set();
  const set = /* @__PURE__ */ new Set([nodeId]);
  for (const e of edges) {
    if (e.source === nodeId) set.add(e.target);
    if (e.target === nodeId) set.add(e.source);
  }
  return set;
}
function topicLegend(nodes) {
  const seen = /* @__PURE__ */ new Map();
  for (const n of nodes) {
    if (n.type === "topic" && n.label) {
      seen.set(n.label, n.color);
    }
  }
  return [...seen.entries()].map(([label, color]) => ({ label, color }));
}

// src/components/NodeHoverCard.tsx
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
function NodeHoverCard({ node, x, y }) {
  if (!node) return null;
  const title = node.label ?? node.title ?? node.id;
  const meta = [
    node.year,
    tierLabel(node.licence_tier),
    node.cited_by_count != null ? `${node.cited_by_count} cites` : null,
    node.type === "topic" && node.count != null ? `${node.count} papers` : null
  ].filter(Boolean).join(" \xB7 ");
  return /* @__PURE__ */ jsxs5("div", { className: "node-hover-card", style: { left: x + 14, top: y + 14 }, role: "tooltip", children: [
    /* @__PURE__ */ jsx6("strong", { children: title }),
    meta && /* @__PURE__ */ jsx6("span", { className: "node-hover-meta", children: meta })
  ] });
}

// src/components/Graph2DView.tsx
import { jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
var ForceGraph2D = lazy(() => import("react-force-graph-2d"));
function Graph2DView({ data, highlightWorkIds, onSelectWork }) {
  const [hovered, setHovered] = useState3(null);
  const [pointer, setPointer] = useState3({ x: 0, y: 0 });
  const theme = readThemeColors();
  const highlight = useMemo3(() => new Set(highlightWorkIds), [highlightWorkIds]);
  const focusNeighbours = useMemo3(
    () => neighbourSet(hovered?.id ?? null, data.links),
    [hovered, data.links]
  );
  return /* @__PURE__ */ jsxs6(
    "div",
    {
      className: "graph-canvas graph-canvas--2d",
      onMouseMove: (e) => setPointer({ x: e.clientX, y: e.clientY }),
      children: [
        /* @__PURE__ */ jsx7(NodeHoverCard, { node: hovered, x: pointer.x, y: pointer.y }),
        /* @__PURE__ */ jsx7(Suspense, { fallback: /* @__PURE__ */ jsx7("p", { className: "graph-status", children: "Loading 2D view\u2026" }), children: /* @__PURE__ */ jsx7(
          ForceGraph2D,
          {
            graphData: data,
            backgroundColor: "rgba(0,0,0,0)",
            nodeRelSize: 6,
            nodeVal: "val",
            linkColor: () => "rgba(255, 140, 60, 0.18)",
            linkWidth: 0.8,
            linkDirectionalArrowLength: 3,
            linkDirectionalArrowRelPos: 1,
            nodeLabel: (n) => {
              const node = n;
              if (node.type === "topic") return String(node.label ?? node.name).slice(0, 36);
              if (node.type === "entity") return String(node.label ?? node.name).slice(0, 48);
              return "";
            },
            onNodeHover: (n) => setHovered(n ?? null),
            onNodeClick: (n) => {
              const node = n;
              if (node.type === "work" || node.id.length === 36) onSelectWork(node.id);
            },
            nodeCanvasObject: (node, ctx, globalScale) => {
              const n = node;
              if (n.x == null || n.y == null) return;
              const dim = hovered && !focusNeighbours.has(n.id) && !highlight.has(n.id) ? 0.15 : 1;
              const r = Math.max(3, (n.val ?? 4) * 1.1) / globalScale;
              ctx.beginPath();
              ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
              ctx.fillStyle = highlight.has(n.id) ? theme.primary : n.color;
              ctx.globalAlpha = dim;
              ctx.fill();
              ctx.globalAlpha = 1;
              if (highlight.has(n.id)) {
                ctx.strokeStyle = theme.primaryHover;
                ctx.lineWidth = 1.5 / globalScale;
                ctx.stroke();
              }
            }
          }
        ) })
      ]
    }
  );
}

// src/components/Graph3D.tsx
import { lazy as lazy2, Suspense as Suspense2, useCallback, useEffect as useEffect2, useMemo as useMemo4, useRef as useRef2, useState as useState4 } from "react";
import * as THREE from "three";
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
var ForceGraph3D = lazy2(() => import("react-force-graph-3d"));
function linkEndpointId(endpoint) {
  return typeof endpoint === "object" ? endpoint.id : endpoint;
}
function Graph3D({
  data,
  highlightWorkIds,
  focusWorkId,
  onSelectWork,
  searchFlyId
}) {
  const fgRef = useRef2(void 0);
  const [hovered, setHovered] = useState4(null);
  const [pointer, setPointer] = useState4({ x: 0, y: 0 });
  const theme = readThemeColors();
  const highlight = useMemo4(() => new Set(highlightWorkIds), [highlightWorkIds]);
  const focusNeighbours = useMemo4(
    () => neighbourSet(hovered?.id ?? null, data.links),
    [hovered, data.links]
  );
  const flyTo = useCallback((node) => {
    const g = fgRef.current;
    if (!g || node.x == null || node.y == null || node.z == null) return;
    const dist = 140;
    const nx = node.x;
    const ny = node.y;
    const nz = node.z ?? 0;
    const distRatio = 1 + dist / Math.hypot(nx, ny, nz || 1);
    g.cameraPosition(
      { x: nx * distRatio, y: ny * distRatio, z: nz * distRatio + 40 },
      { x: nx, y: ny, z: nz },
      1600
    );
  }, []);
  useEffect2(() => {
    if (!focusWorkId) return;
    const node = data.nodes.find((n) => n.id === focusWorkId);
    if (node) flyTo(node);
  }, [data.nodes, focusWorkId, flyTo]);
  useEffect2(() => {
    if (!searchFlyId) return;
    const node = data.nodes.find((n) => n.id === searchFlyId);
    if (node) flyTo(node);
  }, [searchFlyId, data.nodes, flyTo]);
  useEffect2(() => {
    if (highlightWorkIds.length === 0 || !fgRef.current) return;
    if (!data.nodes.some((n) => highlight.has(n.id))) return;
    const t = window.setTimeout(() => {
      fgRef.current?.zoomToFit(1200, 80, (n) => {
        const id = n.id;
        return highlight.has(id);
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [highlight, highlightWorkIds, data.nodes]);
  useEffect2(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setInterval(() => {
      const c = fgRef.current?.controls();
      if (c && !hovered) c.autoRotate = !reduce;
      if (c) c.autoRotateSpeed = 0.28;
    }, 500);
    return () => {
      window.clearInterval(id);
      const c = fgRef.current?.controls();
      if (c) c.autoRotate = false;
    };
  }, [hovered]);
  useEffect2(() => {
    const id = window.setInterval(() => {
      const g = fgRef.current;
      if (!g) return;
      const scene = g.scene();
      scene.fog = new THREE.FogExp2(395016, 16e-4);
      if (!scene.getObjectByName("kb-lights")) {
        const grp = new THREE.Group();
        grp.name = "kb-lights";
        grp.add(new THREE.AmbientLight(16773350, 0.72));
        const key = new THREE.DirectionalLight(16747072, 0.85);
        key.position.set(160, 220, 120);
        grp.add(key);
        const fill = new THREE.DirectionalLight(6340752, 0.25);
        fill.position.set(-120, -80, 60);
        grp.add(fill);
        scene.add(grp);
      }
      window.clearInterval(id);
    }, 120);
    return () => window.clearInterval(id);
  }, [data]);
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      className: "graph-canvas graph-canvas--3d",
      onMouseMove: (e) => setPointer({ x: e.clientX, y: e.clientY }),
      children: [
        /* @__PURE__ */ jsx8(NodeHoverCard, { node: hovered, x: pointer.x, y: pointer.y }),
        /* @__PURE__ */ jsx8(Suspense2, { fallback: /* @__PURE__ */ jsx8("p", { className: "graph-status", children: "Loading 3D view\u2026" }), children: /* @__PURE__ */ jsx8(
          ForceGraph3D,
          {
            ref: fgRef,
            graphData: data,
            backgroundColor: "rgba(0,0,0,0)",
            showNavInfo: false,
            nodeRelSize: 5,
            nodeVal: "val",
            nodeLabel: (n) => {
              const node = n;
              if (node.type === "topic") return String(node.label ?? node.name).slice(0, 36);
              if (node.type === "entity") return String(node.label ?? node.name).slice(0, 48);
              return "";
            },
            nodeOpacity: 0.92,
            nodeColor: (n) => {
              const node = n;
              if (highlight.has(node.id)) return theme.primary;
              if (hovered && !focusNeighbours.has(node.id)) return `${node.color}44`;
              return node.color;
            },
            linkOpacity: 0.35,
            linkWidth: 0.55,
            linkDirectionalParticleWidth: 1.4,
            linkDirectionalParticleColor: () => theme.primaryHover,
            linkDirectionalArrowLength: 2.2,
            linkDirectionalArrowRelPos: 0.92,
            linkColor: (l) => {
              if (!hovered) return "rgba(255, 140, 60, 0.22)";
              const { source, target } = l;
              const sid = linkEndpointId(source);
              const tid = linkEndpointId(target);
              if (hovered.id === sid || hovered.id === tid) return theme.primary;
              return "rgba(255, 120, 40, 0.08)";
            },
            linkDirectionalParticles: (l) => {
              if (!hovered) return 0;
              const { source, target } = l;
              const sid = linkEndpointId(source);
              const tid = linkEndpointId(target);
              return hovered.id === sid || hovered.id === tid ? 4 : 0;
            },
            onNodeHover: (n) => setHovered(n ?? null),
            onNodeClick: (n) => {
              const node = n;
              flyTo(node);
              if (node.type === "work" || node.id.length === 36) {
                onSelectWork(node.id);
              }
            }
          }
        ) })
      ]
    }
  );
}

// src/components/GraphLegend.tsx
import { jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
function GraphLegend({ items }) {
  if (items.length === 0) return null;
  return /* @__PURE__ */ jsx9("div", { className: "graph-legend", "aria-label": "Topic legend", children: items.slice(0, 8).map((item) => /* @__PURE__ */ jsxs8("span", { className: "graph-legend-item", children: [
    /* @__PURE__ */ jsx9("span", { className: "graph-legend-swatch", style: { background: item.color } }),
    /* @__PURE__ */ jsx9("span", { children: item.label.length > 28 ? `${item.label.slice(0, 28)}\u2026` : item.label })
  ] }, item.label)) });
}

// src/components/SearchCombobox.tsx
import { useEffect as useEffect3, useId, useRef as useRef3, useState as useState5 } from "react";
import { Fragment as Fragment2, jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
var DEBOUNCE_MS = 180;
function SearchCombobox({
  fetchItems,
  onPick,
  onSubmitText,
  placeholder,
  ariaLabel,
  emptyQueryNote,
  noun,
  title
}) {
  const [query, setQuery] = useState5("");
  const [open, setOpen] = useState5(false);
  const [items, setItems] = useState5([]);
  const [loading, setLoading] = useState5(false);
  const [active, setActive] = useState5(0);
  const listId = useId();
  const wrapRef = useRef3(null);
  const fetchRef = useRef3(fetchItems);
  fetchRef.current = fetchItems;
  useEffect3(() => {
    if (!open) return;
    const ctrl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(() => {
      fetchRef.current(query.trim(), ctrl.signal).then((next) => {
        setItems(next);
        setActive(0);
      }).catch(() => {
      }).finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [open, query]);
  useEffect3(() => {
    function onDown(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  function pick(item) {
    setQuery("");
    setOpen(false);
    onPick(item);
  }
  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && !loading && items[active]) {
        pick(items[active]);
      } else if (onSubmitText && query.trim()) {
        onSubmitText(query.trim());
        setQuery("");
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }
  const q = query.trim();
  return /* @__PURE__ */ jsxs9("div", { className: "paper-picker", ref: wrapRef, children: [
    /* @__PURE__ */ jsx10(
      "input",
      {
        className: "graph-search",
        value: query,
        onChange: (e) => {
          setQuery(e.target.value);
          setOpen(true);
        },
        onFocus: () => setOpen(true),
        onKeyDown,
        placeholder,
        title,
        role: "combobox",
        "aria-expanded": open,
        "aria-controls": listId,
        "aria-autocomplete": "list",
        "aria-label": ariaLabel
      }
    ),
    open && /* @__PURE__ */ jsxs9("ul", { className: "paper-picker-list", id: listId, role: "listbox", children: [
      !q && emptyQueryNote && /* @__PURE__ */ jsx10("li", { className: "paper-picker-note", children: emptyQueryNote }),
      loading && items.length === 0 && /* @__PURE__ */ jsx10("li", { className: "paper-picker-note", children: "Searching\u2026" }),
      !loading && items.length === 0 && /* @__PURE__ */ jsx10("li", { className: "paper-picker-note", children: q ? `No ${noun} match \u201C${q}\u201D.` : `No ${noun} available yet.` }),
      items.map((item, i) => /* @__PURE__ */ jsx10(
        ComboRow,
        {
          item,
          showGroup: Boolean(item.group) && item.group !== items[i - 1]?.group,
          active: i === active,
          onHover: () => setActive(i),
          onPick: () => pick(item)
        },
        item.key
      ))
    ] })
  ] });
}
function ComboRow({
  item,
  showGroup,
  active,
  onHover,
  onPick
}) {
  return /* @__PURE__ */ jsxs9(Fragment2, { children: [
    showGroup && /* @__PURE__ */ jsx10("li", { className: "paper-picker-group", role: "presentation", children: item.group }),
    /* @__PURE__ */ jsxs9(
      "li",
      {
        role: "option",
        "aria-selected": active,
        className: `paper-picker-item${active ? " is-active" : ""}`,
        onMouseEnter: onHover,
        onMouseDown: (e) => {
          e.preventDefault();
          onPick();
        },
        children: [
          /* @__PURE__ */ jsx10("span", { className: "paper-picker-title", children: item.label }),
          item.meta && /* @__PURE__ */ jsx10("span", { className: "paper-picker-meta", children: item.meta })
        ]
      }
    )
  ] });
}

// src/components/PaperPicker.tsx
import { jsx as jsx11 } from "react/jsx-runtime";
function PaperPicker({ selectedTitle, onPick }) {
  const kb = useKbClient();
  return /* @__PURE__ */ jsx11(
    SearchCombobox,
    {
      fetchItems: async (q, signal) => {
        const hits = await kb.searchWorks(q, 10, signal);
        return [...hits.filter((p) => p.links > 0), ...hits.filter((p) => p.links === 0)].map(
          (p) => ({
            key: p.id,
            label: p.title,
            meta: `${p.year ?? "n.d."} \xB7 ${p.links} citation link${p.links === 1 ? "" : "s"}`,
            value: p
          })
        );
      },
      onPick: (item) => onPick(item.value),
      placeholder: selectedTitle ? `${selectedTitle} \u2014 type to change` : "Type a paper title\u2026",
      title: selectedTitle ?? void 0,
      ariaLabel: "Choose a paper to explore its citations",
      emptyQueryNote: "Most-cited papers",
      noun: "papers"
    }
  );
}

// src/components/GraphToolbar.tsx
import { jsx as jsx12, jsxs as jsxs10 } from "react/jsx-runtime";
function GraphToolbar({
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
  answerPaperCount,
  onLeaveAnswerView,
  selectedPaperTitle,
  onPickPaper,
  onFindPaper
}) {
  const kb = useKbClient();
  return /* @__PURE__ */ jsxs10("div", { className: "graph-float-toolbar", children: [
    mode === "neighbourhood" && /* @__PURE__ */ jsx12(PaperPicker, { selectedTitle: selectedPaperTitle, onPick: onPickPaper }),
    mode === "overview" && /* @__PURE__ */ jsx12(
      SearchCombobox,
      {
        fetchItems: async (q, signal) => {
          const [topics, papers] = await Promise.all([
            kb.searchTopics(q, 6, signal),
            q ? kb.searchWorks(q, 5, signal) : Promise.resolve([])
          ]);
          return [
            ...topics.map((t) => ({
              key: `topic:${t.label}`,
              label: t.label,
              meta: `${t.papers} paper${t.papers === 1 ? "" : "s"}`,
              group: "Topics",
              value: { kind: "topic", label: t.label }
            })),
            ...papers.map((p) => ({
              key: `paper:${p.id}`,
              label: p.title,
              meta: `${p.year ?? "n.d."} \xB7 cited by ${p.cited_by_count ?? 0}`,
              group: "Papers",
              value: { kind: "paper", paper: p }
            }))
          ];
        },
        onPick: ({ value }) => value.kind === "topic" ? setTopic(value.label) : onFindPaper(value.paper),
        onSubmitText: setTopic,
        placeholder: "Search topics or papers\u2026",
        ariaLabel: "Search topics or papers",
        emptyQueryNote: "Largest topics",
        noun: "topics or papers"
      }
    ),
    mode === "entities" && /* @__PURE__ */ jsx12(
      SearchCombobox,
      {
        fetchItems: async (q, signal) => (await kb.searchEntities(q, 10, signal)).map((e) => ({
          key: e.label.toLowerCase(),
          label: e.label,
          meta: `${e.mentions} relation${e.mentions === 1 ? "" : "s"}`,
          value: e.label
        })),
        onPick: ({ value }) => setEntity(value),
        onSubmitText: setEntity,
        placeholder: "Search entities (e.g. anxiety)\u2026",
        ariaLabel: "Search entities",
        emptyQueryNote: "Most-connected entities",
        noun: "entities"
      }
    ),
    mode === "overview" && topic && /* @__PURE__ */ jsx12(FilterChip, { label: "Topic", value: topic, onClear: () => setTopic("") }),
    mode === "entities" && entity && /* @__PURE__ */ jsx12(FilterChip, { label: "Entity", value: entity, onClear: () => setEntity("") }),
    mode === "answer" && answerPaperCount > 0 && /* @__PURE__ */ jsx12(
      FilterChip,
      {
        label: "Answer",
        value: `${answerPaperCount} paper${answerPaperCount === 1 ? "" : "s"}`,
        onClear: onLeaveAnswerView
      }
    ),
    /* @__PURE__ */ jsxs10("label", { className: "graph-toolbar-field", children: [
      /* @__PURE__ */ jsx12("span", { children: "Mode" }),
      /* @__PURE__ */ jsxs10("select", { value: mode, onChange: (e) => setMode(e.target.value), children: [
        /* @__PURE__ */ jsx12("option", { value: "overview", children: "Topics" }),
        /* @__PURE__ */ jsx12("option", { value: "neighbourhood", children: "Citations" }),
        /* @__PURE__ */ jsx12("option", { value: "entities", children: "Entities" }),
        /* @__PURE__ */ jsx12("option", { value: "answer", disabled: answerPaperCount === 0, children: "Answer" })
      ] })
    ] }),
    /* @__PURE__ */ jsx12("button", { type: "button", className: "graph-tool-btn", onClick: () => setUse3D(!use3D), children: use3D ? "2D" : "3D" }),
    /* @__PURE__ */ jsx12("button", { type: "button", className: "graph-tool-btn", onClick: onResetView, children: "Reset view" }),
    /* @__PURE__ */ jsx12("button", { type: "button", className: "graph-tool-btn graph-tool-btn--primary", onClick: onRefresh, children: "Refresh" })
  ] });
}
function FilterChip({ label, value, onClear }) {
  return /* @__PURE__ */ jsxs10("span", { className: "graph-filter-chip", title: value, children: [
    /* @__PURE__ */ jsxs10("span", { className: "graph-filter-chip-label", children: [
      label,
      ":"
    ] }),
    /* @__PURE__ */ jsx12("span", { className: "graph-filter-chip-value", children: value }),
    /* @__PURE__ */ jsx12("button", { type: "button", onClick: onClear, "aria-label": `Clear ${label.toLowerCase()} filter`, children: /* @__PURE__ */ jsx12("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", "aria-hidden": true, children: /* @__PURE__ */ jsx12("path", { d: "M18 6 6 18M6 6l12 12" }) }) })
  ] });
}

// src/components/GraphPanel.tsx
import { Fragment as Fragment3, jsx as jsx13, jsxs as jsxs11 } from "react/jsx-runtime";
function GraphPanel({
  highlightWorkIds,
  answerWorkIds,
  focusWorkId,
  onSelectWork,
  onFocusWork
}) {
  const kb = useKbClient();
  const [picked, setPicked] = useState6(null);
  const [mode, setMode] = useState6("overview");
  const savedViewRef = useRef4(null);
  const prevAnswerKeyRef = useRef4("");
  const [topic, setTopic] = useState6("");
  const [entity, setEntity] = useState6("");
  const [depth] = useState6(1);
  const [use3D, setUse3D] = useState6(true);
  const [searchFlyId, setSearchFlyId] = useState6(null);
  const [loading, setLoading] = useState6(true);
  const [meta, setMeta] = useState6({ warming: false, error: null, hint: null });
  const [nodes, setNodes] = useState6([]);
  const [edges, setEdges] = useState6([]);
  const [resetToken, setResetToken] = useState6(0);
  const citationWorkId = mode === "neighbourhood" ? focusWorkId ?? highlightWorkIds[0] ?? "" : "";
  const restoreFromAnswer = useCallback2(() => {
    const saved = savedViewRef.current;
    if (saved) {
      setMode(saved.mode);
      setTopic(saved.topic);
      setEntity(saved.entity);
      savedViewRef.current = null;
    } else if (mode === "answer") {
      setMode("overview");
    }
    setResetToken((t) => t + 1);
  }, [mode]);
  useEffect4(() => {
    const key = answerWorkIds.join(",");
    if (!key || key === prevAnswerKeyRef.current) return;
    prevAnswerKeyRef.current = key;
    setMode((current) => {
      if (current !== "answer") {
        savedViewRef.current = { mode: current, topic, entity };
      }
      return "answer";
    });
    setResetToken((t) => t + 1);
  }, [answerWorkIds, entity, topic]);
  const load = useCallback2(async () => {
    setLoading(true);
    setMeta({ warming: false, error: null, hint: null });
    if (mode === "answer" && answerWorkIds.length === 0) {
      setNodes([]);
      setEdges([]);
      setMeta({
        warming: false,
        error: null,
        hint: "Ask a question in the chat to see cited papers and how they connect."
      });
      setLoading(false);
      return;
    }
    if (mode === "neighbourhood" && !citationWorkId) {
      setNodes([]);
      setEdges([]);
      setMeta({
        warming: false,
        error: null,
        hint: "Start typing a paper title above to explore who it cites and who cites it."
      });
      setLoading(false);
      return;
    }
    try {
      const data = await kb.getGraph({
        mode,
        topic: mode === "overview" ? topic || void 0 : void 0,
        workId: mode === "neighbourhood" ? citationWorkId : void 0,
        workIds: mode === "answer" ? answerWorkIds : void 0,
        depth: mode === "neighbourhood" ? depth : void 0,
        entity: mode === "entities" ? entity || void 0 : void 0,
        limit: mode === "answer" ? 60 : 80
      });
      if (data.error) {
        setNodes([]);
        setEdges([]);
        setMeta({
          warming: false,
          error: data.error ?? "Could not load graph data.",
          hint: null
        });
        setLoading(false);
        return;
      }
      setNodes(data.nodes ?? []);
      setEdges(data.edges ?? []);
      let hint = data.hint ?? null;
      if (data.entities_unavailable) {
        hint = data.message ?? "Entity triples are not available yet. Stay on Topics or run triple extraction on the KB.";
      } else if (mode === "entities" && (data.nodes?.length ?? 0) === 0) {
        hint = "No relations found for this entity. Pick another from the search list.";
      } else if (mode === "overview" && (data.nodes?.length ?? 0) === 0 && topic) {
        hint = `No papers found for the topic \u201C${topic}\u201D. Pick another from the search list.`;
      } else if (mode === "neighbourhood" && (data.edges?.length ?? 0) === 0) {
        hint = "This paper has no citation links in the library yet \u2014 try another one.";
      } else if (mode === "answer" && (data.nodes?.length ?? 0) > 0 && !(data.edges ?? []).some((e) => e.kind === "cites")) {
        hint = "No citation links found among these papers yet \u2014 cited papers are still highlighted.";
      }
      setMeta({
        warming: Boolean(data.warming),
        error: null,
        hint
      });
    } catch {
      setNodes([]);
      setEdges([]);
      setMeta({ warming: false, error: "Network error while loading the graph.", hint: null });
    }
    setLoading(false);
  }, [answerWorkIds, citationWorkId, depth, entity, kb, mode, topic]);
  useEffect4(() => {
    void load();
  }, [load]);
  const highlight = useMemo5(() => new Set(highlightWorkIds), [highlightWorkIds]);
  const graphData = useMemo5(
    () => enrichGraph(nodes, edges, highlight),
    [nodes, edges, highlight]
  );
  const legend = useMemo5(() => {
    const base = topicLegend(graphData.nodes);
    if (mode === "answer" && highlightWorkIds.length > 0) {
      const theme = readThemeColors();
      return [{ label: "Cited in answer", color: theme.primary }, ...base];
    }
    return base;
  }, [graphData.nodes, highlightWorkIds.length, mode]);
  const resetView = useCallback2(() => {
    setSearchFlyId(null);
    setResetToken((t) => t + 1);
  }, []);
  return /* @__PURE__ */ jsxs11("section", { className: "graph-stage", children: [
    /* @__PURE__ */ jsx13(GraphAtmosphere, {}),
    /* @__PURE__ */ jsx13(
      GraphToolbar,
      {
        mode,
        setMode,
        topic,
        setTopic,
        entity,
        setEntity,
        answerPaperCount: answerWorkIds.length,
        onLeaveAnswerView: restoreFromAnswer,
        onFindPaper: (p) => {
          setSearchFlyId(p.id);
          onSelectWork(p.id);
        },
        use3D,
        setUse3D,
        onRefresh: load,
        onResetView: resetView,
        selectedPaperTitle: picked?.id === citationWorkId ? picked.title : nodes.find((n) => n.id === citationWorkId)?.title ?? null,
        onPickPaper: (p) => {
          setPicked(p);
          onFocusWork(p.id);
        }
      }
    ),
    /* @__PURE__ */ jsx13(GraphLegend, { items: legend }),
    meta.warming && /* @__PURE__ */ jsx13("p", { className: "graph-status", children: "Models warming up \u2014 graph may be empty briefly." }),
    meta.error && /* @__PURE__ */ jsx13("p", { className: "graph-status graph-status--error", children: meta.error }),
    loading && /* @__PURE__ */ jsx13("p", { className: "graph-status", children: "Loading graph\u2026" }),
    !loading && meta.hint && /* @__PURE__ */ jsx13("p", { className: "graph-status graph-status--hint", children: meta.hint }),
    !loading && !meta.error && graphData.nodes.length === 0 && !meta.hint && /* @__PURE__ */ jsx13("p", { className: "graph-status", children: "No nodes in this view. Try Refresh or another mode." }),
    !loading && graphData.nodes.length > 0 && !(mode === "neighbourhood" && graphData.links.length === 0) && /* @__PURE__ */ jsx13(Fragment3, { children: use3D ? /* @__PURE__ */ jsx13(
      Graph3D,
      {
        data: graphData,
        highlightWorkIds,
        focusWorkId,
        searchFlyId,
        onSelectWork
      },
      `3d-${resetToken}`
    ) : /* @__PURE__ */ jsx13(
      Graph2DView,
      {
        data: graphData,
        highlightWorkIds,
        onSelectWork
      }
    ) })
  ] });
}

// src/components/WorkDrawer.tsx
import { useEffect as useEffect5, useState as useState7 } from "react";
import { Fragment as Fragment4, jsx as jsx14, jsxs as jsxs12 } from "react/jsx-runtime";
function WorkDrawer({ workId, onClose }) {
  const kb = useKbClient();
  const [detail, setDetail] = useState7(null);
  const [loading, setLoading] = useState7(false);
  const [failed, setFailed] = useState7(false);
  useEffect5(() => {
    if (!workId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setFailed(false);
    setDetail(null);
    kb.getWork(workId).then((d) => {
      if (d?.work) setDetail(d);
      else setFailed(true);
    }).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, [kb, workId]);
  if (!workId) return null;
  return /* @__PURE__ */ jsxs12("aside", { className: "drawer", role: "dialog", "aria-label": "Work detail", children: [
    /* @__PURE__ */ jsx14("button", { type: "button", className: "drawer-close", onClick: onClose, children: "Close" }),
    loading && /* @__PURE__ */ jsx14("p", { children: "Loading\u2026" }),
    failed && /* @__PURE__ */ jsx14("p", { className: "meta", children: "Could not load this paper. Try again in a moment." }),
    detail && /* @__PURE__ */ jsxs12(Fragment4, { children: [
      /* @__PURE__ */ jsx14("h2", { children: detail.work.title }),
      /* @__PURE__ */ jsxs12("p", { className: "meta", children: [
        [detail.work.year, tierLabel(detail.work.licence_tier)].filter(Boolean).join(" \xB7 "),
        detail.work.doi && /* @__PURE__ */ jsxs12(Fragment4, { children: [
          " \xB7 DOI ",
          detail.work.doi
        ] })
      ] }),
      /* @__PURE__ */ jsxs12("p", { className: "meta", children: [
        "Cited by ",
        detail.work.cited_by_count ?? 0
      ] }),
      /* @__PURE__ */ jsx14("h3", { children: "Sections" }),
      /* @__PURE__ */ jsx14("ul", { children: detail.chunks.map((c) => /* @__PURE__ */ jsxs12("li", { children: [
        /* @__PURE__ */ jsx14("strong", { children: c.heading ?? "Section" }),
        c.snippet && /* @__PURE__ */ jsx14("p", { children: c.snippet })
      ] }, c.id)) })
    ] })
  ] });
}

// src/client.ts
async function waitForEvidenceJob(client, jobId, cfg = {}) {
  const pollMs = cfg.pollMs ?? 1500;
  const maxWaitMs = cfg.maxWaitMs ?? 9e4;
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollMs));
    const status = await client.getEvidenceJob(jobId);
    if (status.error === "rate_limited") continue;
    if (status.error) return status.error;
    if (status.status === "error") return "failed";
    if (status.status === "done" && status.result) return status.result;
  }
  return "timeout";
}
export {
  ChatPanel,
  GraphPanel,
  KbClientProvider,
  WorkDrawer,
  useKbClient,
  useKbClientConfig,
  waitForEvidenceJob
};
