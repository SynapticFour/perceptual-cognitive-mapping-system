import type { CohortModel } from '@/cohort/types';
import { matchUserToPatterns } from '@/core/patterns/pattern-matching';
import type { CognitivePattern, PatternMatch } from '@/core/patterns/types';

/**
 * Compare aggregate cohort emphasis (top constructs) to the global pattern library.
 * Descriptive overlap only — not a match to any person.
 */
export function matchCohortToKnownPatterns(
  model: CohortModel,
  patterns: readonly CognitivePattern[],
  topN = 8
): PatternMatch[] {
  const ids = model.dominantTraits.map((t) => t.traitId).sort((a, b) => a.localeCompare(b));
  return matchUserToPatterns(ids, patterns, topN);
}
