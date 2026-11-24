/** Read AthleMind CSS token values for Three.js / canvas (client only). */

const FALLBACK = {
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
  dv4: "#E06A50",
};

export type ThemeColors = typeof FALLBACK;

export function readThemeColors(): ThemeColors {
  if (typeof document === "undefined") return FALLBACK;
  const s = getComputedStyle(document.documentElement);
  const pick = (v: string, fb: string) => s.getPropertyValue(v).trim() || fb;
  return {
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
    dv4: pick("--dv-4", FALLBACK.dv4),
  };
}

export const TOPIC_PALETTE = ["dv2", "dv1", "dv3", "dv4", "warning", "info"] as const;

export function paletteColor(theme: ThemeColors, slot: (typeof TOPIC_PALETTE)[number]): string {
  return theme[slot];
}