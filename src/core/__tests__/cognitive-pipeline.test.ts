import { describe, expect, it } from 'vitest';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { buildCognitiveModel } from '@/core/cognitive-pipeline';
import { activationSpatialDispersion } from '@/lib/cognitive-map-projection';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import { defaultUiStrings } from '@/lib/ui-strings';
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

describe('buildCognitiveModel', () => {
  it('returns aligned embedding, projection, density, and activation constellation', () => {
    const m = buildCognitiveModel({
      embeddingVector: new Array(32).fill(0).map((_, i) => (i % 10) / 10),
      embeddingDimension: 32,
      display: mockDisplay,
      confidenceComponents: mockConfidence,
      strings: defaultUiStrings,
      syntheticCount: 80,
    });

    expect(m.embedding.length).toBe(32);
    expect(m.allVectors.length).toBeGreaterThan(80);
    expect(m.projectedPoints.length).toBe(m.allVectors.length);
    expect(m.projectedPoints[0]).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
    expect(m.density.grid.length).toBeGreaterThan(0);
    expect(m.density.maxD).toBeGreaterThan(0);
    expect(m.activationIndices.length).toBeGreaterThan(0);
    expect(m.activationDomains.length).toBe(m.activationIndices.length);
    expect(m.kinds.slice(0, m.activationIndices.length).every((k) => k === 'activation')).toBe(true);
    expect(m.centroid).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
    expect(m.pointWeights[0]).toBeGreaterThan(0);
    expect(m.clusterVisualBoost.length).toBe(m.projectedPoints.length);
    expect(m.clusterVisualBoost.every((b) => b >= 1)).toBe(true);
    expect(Array.isArray(m.activationClusterHints)).toBe(true);
    expect(m.cognitiveRegions.length).toBeGreaterThanOrEqual(2);
    expect(m.cognitiveRegions.length).toBeLessThanOrEqual(5);
    expect(m.regionValidation.regionCount).toBe(m.cognitiveRegions.length);
    expect(m.activations.length).toBeGreaterThan(0);
    expect(m.activations[0]).toMatchObject({
      traitId: expect.any(String),
      domain: expect.any(String),
      weight: expect.any(Number),
    });
  });

  it('activation projections keep non-point spatial dispersion (field, not a blob)', () => {
    const m = buildCognitiveModel({
      embeddingVector: new Array(32).fill(0).map((_, i) => (i % 10) / 10),
      embeddingDimension: 32,
      display: mockDisplay,
      confidenceComponents: mockConfidence,
      strings: defaultUiStrings,
      syntheticCount: 120,
    });
    const k = m.activations.length;
    expect(k).toBeGreaterThanOrEqual(3);
    const d = activationSpatialDispersion(m.projectedPoints, k);
    expect(d.spanX + d.spanY).toBeGreaterThan(0.055);
    expect(d.varianceX + d.varianceY).toBeGreaterThan(1e-4);
  });
});
