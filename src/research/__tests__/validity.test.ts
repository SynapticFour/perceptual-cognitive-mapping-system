import { describe, it, expect } from 'vitest';

import { DEFAULT_COGNITIVE_VECTOR } from '@/model/cognitive-dimensions';
import { convergentValidity, dimensionCorrelationMatrix, pearsonCorrelation } from '@/research/validity';

describe('validity', () => {
  it('pearsonCorrelation matches perfect linear', () => {
    expect(pearsonCorrelation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 5);
  });

  it('convergentValidity returns finite r and p for n>3', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [1.1, 1.9, 3.2, 3.8, 5.1];
    const out = convergentValidity(x, y);
    expect(out.n).toBe(5);
    expect(out.r).toBeGreaterThan(0.99);
    expect(out.pApprox).toBeGreaterThan(0);
    expect(out.interpretation.length).toBeGreaterThan(10);
  });

  it('dimensionCorrelationMatrix is symmetric with diagonal 1', () => {
    const p1 = { ...DEFAULT_COGNITIVE_VECTOR, F: 0.8, P: 0.2 };
    const p2 = { ...DEFAULT_COGNITIVE_VECTOR, F: 0.7, P: 0.3 };
    const p3 = { ...DEFAULT_COGNITIVE_VECTOR, F: 0.6, P: 0.4 };
    const { dimensions, matrix } = dimensionCorrelationMatrix([p1, p2, p3]);
    expect(dimensions.length).toBe(10);
    expect(matrix[0]![0]).toBe(1);
    expect(matrix[0]![1]).toBeCloseTo(matrix[1]![0]!, 5);
  });
});
