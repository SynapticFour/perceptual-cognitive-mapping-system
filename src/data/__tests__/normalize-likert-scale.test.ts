import { describe, expect, it } from 'vitest';
import { normalizeLikertResponse } from '@/data/questions';

describe('normalizeLikertResponse', () => {
  it('maps 5-point to [0,1]', () => {
    expect(normalizeLikertResponse(1, 'likert5')).toBe(0);
    expect(normalizeLikertResponse(5, 'likert5')).toBe(1);
    expect(normalizeLikertResponse(3, 'likert5')).toBe(0.5);
  });

  it('maps 3-point to [0,1]', () => {
    expect(normalizeLikertResponse(1, 'likert3')).toBe(0);
    expect(normalizeLikertResponse(3, 'likert3')).toBe(1);
    expect(normalizeLikertResponse(2, 'likert3')).toBe(0.5);
  });
});
