import { describe, expect, it } from 'vitest';
import { defaultUiStrings } from '@/lib/ui-strings';
import type { CognitiveFeatures } from '@/model/latent-representation';
import {
  dimensionScoreBand,
  interpretCognitiveFeatures,
  interpretDimensionScore,
} from '@/lib/interpretation';

describe('interpretation helpers', () => {
  it('maps scores into expected bands', () => {
    expect(dimensionScoreBand(0.8)).toBe('high');
    expect(dimensionScoreBand(0.2)).toBe('low');
    expect(dimensionScoreBand(0.5)).toBe('mid');
  });

  it('builds cognitive feature summary with fallbacks', () => {
    const features: CognitiveFeatures = {
      averageResponseTime: 1500,
      responseTimeVariance: 200,
      responseTimeTrend: 0,
      answerConsistency: 0.2,
      intraCategoryVariance: 0.1,
      crossCategoryCorrelation: 0.1,
      ambiguityTolerance: 0.5,
      switchingBehavior: 0.2,
      decisionLatency: 0.1,
      overallConfidence: 0.4,
      confidenceVariance: 0.1,
      confidenceCalibration: 0.5,
      responsePattern: [0.2, 0.4],
      entropy: 0.3,
      clusteringCoefficient: 0.4,
      categoryBalance: {},
      difficultyPreference: 0.5,
      culturalAlignment: 0.5,
    };
    const out = interpretCognitiveFeatures(features, defaultUiStrings);
    expect(out.summary.length).toBeGreaterThan(0);
    expect(out.patterns.length).toBeGreaterThan(0);
    expect(out.notes.length).toBeGreaterThan(0);
    expect(out.confidence).toBeGreaterThanOrEqual(0);
    expect(out.confidence).toBeLessThanOrEqual(1);
  });

  it('returns empty string for unknown interpretation keys', () => {
    expect(interpretDimensionScore('F', 0.5, {})).toBe('');
  });
});
