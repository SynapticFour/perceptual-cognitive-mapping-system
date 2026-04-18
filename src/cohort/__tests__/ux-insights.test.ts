import { describe, expect, it } from 'vitest';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { buildCognitiveModel } from '@/core/cognitive-pipeline';
import { buildCohortCognitiveMap } from '@/cohort/cohort-cognitive-map';
import { deriveEnvironmentSignals } from '@/cohort/environment-signals';
import { mapInteractionFriction } from '@/cohort/interaction-friction';
import { sanitizeGuidanceText } from '@/cohort/ux-copy-safety';
import { buildGuidanceInsights, buildGuidanceRecommendations } from '@/cohort/ux-insights';
import { MAX_GUIDANCE_INSIGHTS } from '@/cohort/ux-types';
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

function makeModel(seed: number) {
  return buildCognitiveModel({
    embeddingVector: new Array(32).fill(0).map((_, i) => (((i + seed) % 10) + Math.sin(seed)) / 12),
    embeddingDimension: 32,
    display: mockDisplay,
    confidenceComponents: mockConfidence,
    strings: defaultUiStrings,
    syntheticCount: 64,
  });
}

describe('sanitizeGuidanceText', () => {
  it('strips banned diagnostic substrings', () => {
    expect(sanitizeGuidanceText('Discuss autism spectrum')).not.toMatch(/autism/i);
    expect(sanitizeGuidanceText('ADHD traits')).not.toMatch(/adhd/i);
  });
});

describe('buildGuidanceInsights', () => {
  it('returns at most MAX_GUIDANCE_INSIGHTS items', () => {
    const cm = buildCohortCognitiveMap([makeModel(1), makeModel(2), makeModel(3)]);
    const env = deriveEnvironmentSignals(cm);
    const friction = mapInteractionFriction(cm);
    const insights = buildGuidanceInsights(cm, env, friction);
    expect(insights.length).toBeLessThanOrEqual(MAX_GUIDANCE_INSIGHTS);
    expect(insights.every((i) => i.title.length > 0)).toBe(true);
  });
});

describe('buildGuidanceRecommendations', () => {
  it('maps environment signals to optional-sounding cards', () => {
    const cm = buildCohortCognitiveMap([makeModel(4)]);
    const env = deriveEnvironmentSignals(cm);
    const recs = buildGuidanceRecommendations(env);
    expect(recs.length).toBe(env.length);
    for (const r of recs) {
      expect(r.title.length).toBeGreaterThan(3);
      expect(r.description.toLowerCase()).not.toMatch(/^must\b/);
    }
  });
});
