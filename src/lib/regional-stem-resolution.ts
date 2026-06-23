/**
 * Runtime selection of question stem text by region (`global` | `ghana` | `west_africa`).
 * Deterministic, offline; scoring remains keyed by `question.id` only.
 */

import type { AssessmentQuestion, QuestionStemRegion } from '@/data/questions';
import { culturalAdaptiveStemKey, STEM_REGION_FALLBACK_CHAIN } from './stem-region-fallback';

export type { QuestionStemRegion } from '@/data/questions';

/** Re-export locale/env → region mapping used when loading banks and when resolving display text. */
export { culturalAdaptiveStemKey as stemRegionFromLocale } from './stem-region-fallback';

function trimmed(s: string | undefined): string | undefined {
  if (typeof s !== 'string') return undefined;
  const t = s.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Pick the stem for `region`, walking {@link STEM_REGION_FALLBACK_CHAIN}, then `question.text`.
 * Preserves measurement intent: all variants are paraphrases of the same construct.
 */
export function resolveStemForRegion(question: AssessmentQuestion, region: QuestionStemRegion): string {
  const sv = question.stemVariants;
  if (!sv) {
    return trimmed(question.text) ?? question.id;
  }
  const chain: QuestionStemRegion[] = [region, ...STEM_REGION_FALLBACK_CHAIN[region]];
  for (const key of chain) {
    const t = trimmed(sv[key]);
    if (t) return t;
  }
  const any =
    trimmed(sv.francophone_west_africa) ??
    trimmed(sv.east_africa) ??
    trimmed(sv.ghana) ??
    trimmed(sv.west_africa) ??
    trimmed(sv.global) ??
    trimmed(question.text);
  return any ?? question.id;
}

/** Resolve display region from UI locale string (Next-intl) plus `NEXT_PUBLIC_PCMS_CULTURAL_STEM` override. */
export function displayStemRegionForUiLocale(uiLocale: string): QuestionStemRegion {
  return culturalAdaptiveStemKey(uiLocale);
}
