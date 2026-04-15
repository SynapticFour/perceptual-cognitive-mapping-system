import type { CognitiveFeatures } from '@/model/latent-representation';
import type { CognitiveProfilePublic } from '@/types/profile-public';
import type { RoutingWeightKey } from '@/adaptive/routing-tags';
import type { UiStrings } from '@/lib/ui-strings';

/**
 * Deterministic, non-clinical interpretation from extracted features.
 * Copy is resolved from `strings` so it can be translated later.
 */
export function interpretCognitiveFeatures(features: CognitiveFeatures, strings: UiStrings): CognitiveProfilePublic {
  const patterns: string[] = [];
  const notes: string[] = [];

  if (features.answerConsistency >= 0.62) {
    patterns.push(strings['pipeline.pattern.answer_consistency_high']);
  } else if (features.answerConsistency <= 0.38) {
    patterns.push(strings['pipeline.pattern.answer_consistency_low']);
  }

  if (
    features.averageResponseTime > 0 &&
    features.responseTimeVariance > features.averageResponseTime * 0.5
  ) {
    notes.push(strings['pipeline.note.response_time_variance']);
  }

  if (features.entropy > 0.55) {
    notes.push(strings['pipeline.note.entropy_high']);
  }

  const summary =
    features.overallConfidence >= 0.55
      ? strings['pipeline.summary.confident']
      : features.overallConfidence > 0
        ? strings['pipeline.summary.limited']
        : strings['pipeline.summary.preliminary'];

  const confidence = Math.max(
    0,
    Math.min(1, features.overallConfidence || features.answerConsistency)
  );

  return {
    summary,
    patterns: patterns.length ? patterns : [strings['pipeline.patterns_fallback']],
    notes: notes.length ? notes : [strings['pipeline.notes_fallback']],
    confidence
  };
}

export type DimensionInterpretKey = RoutingWeightKey;
export type ScoreBand = 'high' | 'mid' | 'low';

/** Maps a unit-interval score (0–1) to a coarse band for copy selection. */
export function dimensionScoreBand(score01: number): ScoreBand {
  if (score01 >= 0.62) return 'high';
  if (score01 <= 0.38) return 'low';
  return 'mid';
}

/** One-sentence, non-clinical copy for a routing dimension at the given 0–1 score. */
export function interpretDimensionScore(dim: DimensionInterpretKey, score01: number, strings: UiStrings): string {
  const band = dimensionScoreBand(score01);
  const key = `interp.${dim}.${band}`;
  const v = strings[key];
  return typeof v === 'string' ? v : '';
}
