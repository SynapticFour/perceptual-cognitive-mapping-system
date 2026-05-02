/**
 * Per-routing-dimension statistics for transparency and adaptive-engine diagnostics.
 * Mean matches the same weighted construction as results display; variance matches the
 * weighted-contribution stream used inside {@link calculateResearchConfidence}.
 */

import type { QuestionResponse } from '@/data/questions';
import type { AssessmentQuestion } from '@/data/questions';
import { normalizeLikertResponse } from '@/data/questions';
import {
  calculateResearchConfidence,
  adjustedNormalizedResponse,
  populationVariance,
} from '@/scoring';
import { ROUTING_WEIGHT_KEYS, type RoutingWeightKey } from '@/adaptive/routing-tags';

const VARIANCE_WEIGHT_THRESHOLD = 0.3;

export type PerDimensionRoutingDiagnostics = {
  /** Weighted mean of adjusted item scores (weights ≥ 0.3), [0,1]. */
  mean01: number;
  /** Variance of weighted contributions (same inputs as consistency in scoring). */
  varianceWeightedContributions: number;
  /** Final routing confidence (evidence × consistency, with research caps). */
  confidence: number;
  /** Count of answered items with w ≥ 0.3 on this dimension. */
  contributingItems: number;
};

/**
 * Deterministic, offline: one pass for means/variance + scoring model for confidence.
 */
export function buildPerDimensionRoutingDiagnostics(
  responses: QuestionResponse[],
  questionsById: Map<string, AssessmentQuestion>
): Record<RoutingWeightKey, PerDimensionRoutingDiagnostics> {
  const scoring = calculateResearchConfidence(responses, questionsById);
  const out = {} as Record<RoutingWeightKey, PerDimensionRoutingDiagnostics>;

  for (const d of ROUTING_WEIGHT_KEYS) {
    const weightedAdjusted: number[] = [];
    let acc = 0;
    let wsum = 0;

    for (const qr of responses) {
      const q = questionsById.get(qr.questionId);
      if (!q) continue;
      const w = q.dimensionWeights[d] ?? 0;
      if (w < VARIANCE_WEIGHT_THRESHOLD) continue;

      const norm = normalizeLikertResponse(qr.response, q.responseScale ?? 'likert5');
      const adj = adjustedNormalizedResponse(norm, q.reverseScored ?? false);
      weightedAdjusted.push(adj * w);
      acc += adj * w;
      wsum += w;
    }

    const mean01 = wsum > 0 ? acc / wsum : 0.5;
    const varianceWeightedContributions =
      weightedAdjusted.length >= 2 ? populationVariance(weightedAdjusted) : 0;

    out[d] = {
      mean01: Math.round(mean01 * 10000) / 10000,
      varianceWeightedContributions: Math.round(varianceWeightedContributions * 10000) / 10000,
      confidence: scoring.confidenceComponents[d].finalConfidence,
      contributingItems: weightedAdjusted.length,
    };
  }

  return out;
}
