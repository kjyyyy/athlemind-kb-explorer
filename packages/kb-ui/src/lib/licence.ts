const TIER_LABEL: Record<string, string> = {
  open_full: "Open access",
  open_restricted: "Open access · restricted reuse",
  facts_only: "Abstract only",
  metadata_only: "Citation only",
};

export function tierLabel(tier: string | null | undefined): string | undefined {
  if (!tier) return undefined;
  return TIER_LABEL[tier] ?? tier.replace(/_/g, " ");
}
