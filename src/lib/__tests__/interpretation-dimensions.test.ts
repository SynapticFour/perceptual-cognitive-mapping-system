import { describe, it, expect } from 'vitest';
import { dimensionScoreBand, interpretDimensionScore } from '@/lib/interpretation';
import { defaultUiStrings } from '@/lib/ui-strings';

describe('interpretDimensionScore', () => {
  it('returns high band for strong scores', () => {
    expect(dimensionScoreBand(0.7)).toBe('high');
    expect(interpretDimensionScore('F', 0.7, defaultUiStrings).length).toBeGreaterThan(10);
  });

  it('returns low band for low scores', () => {
    expect(dimensionScoreBand(0.2)).toBe('low');
    expect(interpretDimensionScore('P', 0.2, defaultUiStrings).toLowerCase()).toContain('tangible');
  });
});
