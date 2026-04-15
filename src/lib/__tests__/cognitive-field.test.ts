import { describe, expect, it } from 'vitest';
import { buildCognitiveModel } from '@/core/cognitive-pipeline';
import { buildCognitiveFieldGrid } from '@/lib/cognitive-field';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import { defaultUiStrings } from '@/lib/ui-strings';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import type { ConfidenceComponents } from '@/scoring';

const mockDisplay: DimensionDisplayModel = {
  rawPercent: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 50])) as DimensionDisplayModel['rawPercent'],
  weightedPercent: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 50])) as DimensionDisplayModel['weightedPercent'],
  itemsContributing: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 0])) as DimensionDisplayModel['itemsContributing'],
};

const mockConfidence: ConfidenceComponents = Object.fromEntries(
  ROUTING_WEIGHT_KEYS.map((d) => [
    d,
    {
      effectiveEvidence: 1,
      reliability: 1,
      consistency: 1,
      finalConfidence: 0.8,
      meetsMinimumSample: true,
    },
  ])
) as ConfidenceComponents;

describe('cognitive-field', () => {
  it('builds a multi-peak field with broad coverage', () => {
    const m = buildCognitiveModel({
      embeddingVector: new Array(32).fill(0).map((_, i) => (i % 10) / 10),
      embeddingDimension: 32,
      display: mockDisplay,
      confidenceComponents: mockConfidence,
      strings: defaultUiStrings,
      syntheticCount: 100,
    });
    const f = buildCognitiveFieldGrid(m, 64, 64);
    expect(f.rows).toBe(64);
    expect(f.cols).toBe(64);
    expect(f.maxIntensity).toBeGreaterThan(0);
    expect(f.metrics.localMaxima).toBeGreaterThanOrEqual(2);
    expect(f.metrics.maxPeakShare).toBeLessThanOrEqual(0.65 + 1e-6);
    expect(f.metrics.coverage).toBeGreaterThanOrEqual(0.5 - 1e-6);
  });
});

