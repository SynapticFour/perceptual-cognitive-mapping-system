export const TRAIT_DOMAINS = [
  'perception',
  'cognition',
  'attention',
  'regulation',
  'social',
  'motivation',
] as const;

export type TraitDomain = (typeof TRAIT_DOMAINS)[number];

/** Stable display colors for constellation points (WCAG-friendly on light map backgrounds). */
export const TRAIT_DOMAIN_HEX: Record<TraitDomain, string> = {
  perception: '#0e7490',
  cognition: '#6d28d9',
  attention: '#c2410c',
  regulation: '#be185d',
  social: '#047857',
  motivation: '#a16207',
};

export function formatTraitDomainLabel(domain: TraitDomain): string {
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}
