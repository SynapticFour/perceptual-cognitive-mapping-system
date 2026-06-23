import { describe, it, expect } from 'vitest';

import type { AssessmentQuestion } from '@/data/questions';
import { resolveStemForRegion } from '@/lib/regional-stem-resolution';

function baseQ(over: Partial<AssessmentQuestion>): AssessmentQuestion {
  return {
    id: 'q1',
    text: 'Default load text',
    category: 'focus',
    dimensionWeights: { F: 1, P: 0, S: 0, E: 0, R: 0, C: 0, T: 0, I: 0, A: 0, V: 0 },
    informationGain: 0.65,
    type: 'core',
    difficulty: 'broad',
    tags: [],
    ...over,
  } as AssessmentQuestion;
}

describe('regional-stem-resolution', () => {
  it('returns primary region when present', () => {
    const q = baseQ({
      stemVariants: {
        global: 'Global wording',
        ghana: 'Ghana wording',
        west_africa: 'WA wording',
      },
    });
    expect(resolveStemForRegion(q, 'ghana')).toBe('Ghana wording');
    expect(resolveStemForRegion(q, 'west_africa')).toBe('WA wording');
  });

  it('falls back to global when requested region is empty', () => {
    const q = baseQ({
      stemVariants: {
        global: 'Global only',
        ghana: '',
        west_africa: '   ',
      },
    });
    expect(resolveStemForRegion(q, 'ghana')).toBe('Global only');
    expect(resolveStemForRegion(q, 'west_africa')).toBe('Global only');
  });

  it('falls back to any other variant then text when global missing', () => {
    const q = baseQ({
      text: 'Fallback text',
      stemVariants: {
        global: '',
        ghana: 'Ghana backup',
        west_africa: '',
      },
    });
    expect(resolveStemForRegion(q, 'west_africa')).toBe('Ghana backup');
  });

  it('francophone_west_africa falls back to west_africa then global', () => {
    const q = baseQ({
      stemVariants: {
        global: 'Global wording',
        ghana: 'Ghana wording',
        west_africa: 'WA wording',
        francophone_west_africa: '',
        east_africa: '',
      },
    });
    expect(resolveStemForRegion(q, 'francophone_west_africa')).toBe('WA wording');
  });

  it('east_africa falls back to global when empty', () => {
    const q = baseQ({
      stemVariants: {
        global: 'Global wording',
        ghana: 'Gh',
        west_africa: 'WA',
        francophone_west_africa: '',
        east_africa: '',
      },
    });
    expect(resolveStemForRegion(q, 'east_africa')).toBe('Global wording');
  });
});
