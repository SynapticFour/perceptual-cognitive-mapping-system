import { ROUTING_WEIGHT_KEYS, type RoutingWeightKey } from '@/adaptive/routing-tags';
import type { QuestionResponse } from '@/data/questions';
import { getAssessmentQuestions, normalizeLikertResponse } from '@/data/questions';
import { adjustedNormalizedResponse, type ConfidenceComponents } from '@/scoring';

const CONTRIBUTION_THRESHOLD = 0.3;

export type DimensionDisplayModel = {
  rawPercent: Record<RoutingWeightKey, number>;
  weightedPercent: Record<RoutingWeightKey, number>;
  itemsContributing: Record<RoutingWeightKey, number>;
};

function emptyModel(): DimensionDisplayModel {
  const rawPercent = {} as Record<RoutingWeightKey, number>;
  const weightedPercent = {} as Record<RoutingWeightKey, number>;
  const itemsContributing = {} as Record<RoutingWeightKey, number>;
  for (const d of ROUTING_WEIGHT_KEYS) {
    rawPercent[d] = 50;
    weightedPercent[d] = 50;
    itemsContributing[d] = 0;
  }
  return { rawPercent, weightedPercent, itemsContributing };
}

/**
 * Derives per-dimension display scores from questionnaire history and routing confidence.
 */
export function buildDimensionDisplayModel(
  history: QuestionResponse[],
  culturalContext: 'western' | 'ghana' | 'universal',
  confidenceComponents: ConfidenceComponents
): DimensionDisplayModel {
  const model = emptyModel();
  if (history.length === 0) {
    return model;
  }

  const bank = getAssessmentQuestions('all', culturalContext);
  const byId = new Map(bank.map((q) => [q.id, q]));

  for (const d of ROUTING_WEIGHT_KEYS) {
    let wsum = 0;
    let acc = 0;
    let items = 0;

    for (const qr of history) {
      const q = byId.get(qr.questionId);
      if (!q) continue;
      const w = q.dimensionWeights[d] ?? 0;
      if (w < CONTRIBUTION_THRESHOLD) continue;
      items += 1;
      const norm = normalizeLikertResponse(qr.response);
      const adj = adjustedNormalizedResponse(norm, q.reverseScored ?? false);
      acc += adj * w;
      wsum += w;
    }

    const raw01 = wsum > 0 ? acc / wsum : 0.5;
    const c = confidenceComponents[d].finalConfidence;
    const weighted01 = raw01 * c + 0.5 * (1 - c);

    model.rawPercent[d] = Math.round(raw01 * 1000) / 10;
    model.weightedPercent[d] = Math.round(weighted01 * 1000) / 10;
    model.itemsContributing[d] = items;
  }

  return model;
}
