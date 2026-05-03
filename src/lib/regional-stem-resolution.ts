/**
 * Runtime selection of question stem text by region (`global` | `ghana` | `west_africa`).
 * Deterministic, offline; scoring remains keyed by `question.id` only.
 */

import type { AssessmentQuestion, QuestionStemRegion } from '@/data/questions';
import { culturalAdaptiveStemKey } from '@/lib/cultural-adaptive-bank';

export type { QuestionStemRegion } from '@/data/questions';

/** Re-export locale/env → region mapping used when loading banks and when resolving display text. */
export { culturalAdaptiveStemKey as stemRegionFromLocale } from '@/lib/cultural-adaptive-bank';

function trimmed(s: string | undefined): string | undefined {
  if (typeof s !== 'string') return undefined;
  const t = s.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Pick the stem for `region`, then fall back to `global`, then to `question.text`.
 * Preserves measurement intent: all variants are authored as paraphrases of the same construct.
 */
export function resolveStemForRegion(question: AssessmentQuestion, region: QuestionStemRegion): string {
  const sv = question.stemVariants;
  if (!sv) {
    return trimmed(question.text) ?? question.id;
  }
  const primary = trimmed(sv[region]);
  if (primary) return primary;
  const globalFb = trimmed(sv.global);
  if (globalFb) return globalFb;
  const any =
    trimmed(sv.ghana) ?? trimmed(sv.west_africa) ?? trimmed(sv.global) ?? trimmed(question.text);
  return any ?? question.id;
}

/** Resolve display region from UI locale string (Next-intl) plus `NEXT_PUBLIC_PCMS_CULTURAL_STEM` override. */
export function displayStemRegionForUiLocale(uiLocale: string): QuestionStemRegion {
  return culturalAdaptiveStemKey(uiLocale);
}
