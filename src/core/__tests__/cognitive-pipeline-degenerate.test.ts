import { describe, expect, it, vi } from 'vitest';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { buildCognitiveModel } from '@/core/cognitive-pipeline';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import type { ConfidenceComponents } from '@/scoring';

vi.mock('@/core/traits/trait-mapping', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/core/traits/trait-mapping')>();
  return {
    ...mod,
    mapAnswersToActivations: () => [],
  };
});

const mockDisplay: DimensionDisplayModel = {
  rawPercent: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 50])) as DimensionDisplayModel['rawPercent'],
  weightedPercent: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 50])) as DimensionDisplayModel['weightedPercent'],
  itemsContributing: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 0])) as DimensionDisplayModel['itemsContributing'],
};

const mockConfidence: ConfidenceComponents = Object.fromEntries(
  ROUTING_WEIGHT_KEYS.map((d) => [
    d,
    {
      effectiveEvidence: 0,
      reliability: 0,
      consistency: 1,
      finalConfidence: 0,
      meetsMinimumSample: false,
    },
  ])
) as ConfidenceComponents;

describe('buildCognitiveModel degenerate activations', () => {
  it('returns a safe model with no activation projection when mapAnswers yields no weighted traits', () => {
    const m = buildCognitiveModel({
      embeddingVector: null,
      embeddingDimension: 32,
      display: mockDisplay,
      confidenceComponents: mockConfidence,
      syntheticCount: 40,
    });

    expect(m.activations).toHaveLength(0);
    expect(m.activationIndices).toHaveLength(0);
    expect(m.projectedPoints.length).toBeGreaterThan(0);
    expect(m.cognitiveRegions).toHaveLength(0);
    expect(m.embedding.every((v) => v === 0)).toBe(true);
    for (const d of ROUTING_WEIGHT_KEYS) {
      expect(m.routingScores[d]).toBeCloseTo(0.5, 5);
    }
  });
});
