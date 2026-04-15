import { describe, it, expect } from 'vitest';

import type { AssessmentQuestion } from '@/data/questions';
import { adjustedNormalizedResponse, dimensionContribution } from '@/scoring';

describe('scoring-model', () => {
  it('inverts normalised response when reverseScored is true', () => {
    expect(adjustedNormalizedResponse(0.75, false)).toBe(0.75);
    expect(adjustedNormalizedResponse(0.75, true)).toBe(0.25);
    expect(adjustedNormalizedResponse(0, true)).toBe(1);
    expect(adjustedNormalizedResponse(1, true)).toBe(0);
  });

  it('uses adjusted response in dimensionContribution', () => {
    const q: Pick<AssessmentQuestion, 'dimensionWeights' | 'reverseScored'> = {
      dimensionWeights: { F: 1, P: 0, S: 0, E: 0, R: 0, C: 0 },
      reverseScored: true,
    };
    const rawNorm = 0.8;
    const contrib = dimensionContribution(rawNorm, q, 'F');
    expect(contrib).toBeCloseTo((1 - rawNorm) * 1, 10);
  });
});
