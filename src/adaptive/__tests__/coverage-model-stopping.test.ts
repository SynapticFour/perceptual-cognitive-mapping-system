import { describe, expect, it } from 'vitest';
import { CoverageModel } from '@/adaptive/coverage-model';
import type { TagCoverageVector } from '@/adaptive/routing-tags';

function fillMet(n: number, value: number): TagCoverageVector {
  const keys = ['F', 'P', 'S', 'E', 'R', 'C', 'T', 'I', 'A', 'V'] as const;
  const out = {} as TagCoverageVector;
  for (let i = 0; i < keys.length; i += 1) {
    out[keys[i]!] = i < n ? value : 0.1;
  }
  return out;
}

describe('CoverageModel stoppingRule', () => {
  it('majority: accepts when ≥7 dimensions at threshold', () => {
    const m = new CoverageModel({
      researchConfidenceThreshold: 0.75,
      maxQuestionsPerDimension: 5,
      stoppingRule: 'majority',
    });
    const cov = fillMet(7, 0.8);
    const r = m.meetsResearchThresholds(cov);
    expect(r.meetsThreshold).toBe(true);
  });

  it('majority: rejects when only 6 dimensions at threshold', () => {
    const m = new CoverageModel({
      researchConfidenceThreshold: 0.75,
      maxQuestionsPerDimension: 5,
      stoppingRule: 'majority',
    });
    const cov = fillMet(6, 0.8);
    const r = m.meetsResearchThresholds(cov);
    expect(r.meetsThreshold).toBe(false);
  });

  it('all: requires every dimension at threshold', () => {
    const m = new CoverageModel({
      researchConfidenceThreshold: 0.75,
      maxQuestionsPerDimension: 5,
      stoppingRule: 'all',
    });
    const cov = fillMet(9, 0.8);
    const r = m.meetsResearchThresholds(cov);
    expect(r.meetsThreshold).toBe(false);

    const cov10 = fillMet(10, 0.8);
    const r2 = m.meetsResearchThresholds(cov10);
    expect(r2.meetsThreshold).toBe(true);
  });
});
