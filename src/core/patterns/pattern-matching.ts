import { formatTraitLabel } from '@/core/traits/trait-mapping';
import type { CognitivePattern, PatternMatch } from '@/core/patterns/types';

/**
 * Human-readable trait list for UI (no fixed pattern names).
 */
export function describePatternTraits(traits: readonly string[]): string {
  return traits.map((id) => formatTraitLabel(id)).join(' + ');
}

/**
 * Best overlap between a user signature and mined patterns.
 * Score blends Jaccard overlap on trait ids with pattern prevalence (support/strength).
 */
export function matchUserToPatterns(
  userSignature: readonly string[],
  patterns: readonly CognitivePattern[],
  topK = 5
): PatternMatch[] {
  if (userSignature.length === 0 || patterns.length === 0) return [];
  const userSet = new Set(userSignature);
  const scored: PatternMatch[] = [];

  for (const p of patterns) {
    const t = p.traits;
    let overlap = 0;
    for (const id of t) {
      if (userSet.has(id)) overlap++;
    }
    if (overlap === 0) continue;
    const union = new Set([...userSignature, ...t]).size;
    const jaccard = overlap / union;
    const supportNorm = Math.min(1, p.support / 25);
    const score = jaccard * (0.42 + 0.33 * Math.min(1, p.strength * 4) + 0.25 * supportNorm);
    scored.push({ pattern: p, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
