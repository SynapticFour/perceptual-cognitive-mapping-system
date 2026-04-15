import { describe, it, expect } from 'vitest';
import { StatisticalFeatureExtractor } from '@/model';

describe('StatisticalFeatureExtractor', () => {
  it('returns neutral features for empty responses (no throw)', () => {
    const ex = new StatisticalFeatureExtractor();
    const f = ex.extract([]);
    expect(f.answerConsistency).toBe(0.5);
    expect(f.responsePattern).toEqual([]);
  });
});
