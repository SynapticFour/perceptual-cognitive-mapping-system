import { describe, expect, it } from 'vitest';
import { createRng, generateSyntheticPopulation } from '@/core/synthetic-population';

describe('generateSyntheticPopulation', () => {
  const bases = [
    [0.2, 0.8, 0.5],
    [0.9, 0.1, 0.4],
  ];

  it('returns count rows of correct dimension', () => {
    const pop = generateSyntheticPopulation(bases, 50, 0.12);
    expect(pop.length).toBe(50);
    expect(pop.every((r) => r.length === 3)).toBe(true);
  });

  it('clamps to unit interval', () => {
    const rnd = createRng(42);
    const pop = generateSyntheticPopulation(bases, 200, 0.2, rnd);
    expect(pop.every((r) => r.every((x) => x >= 0 && x <= 1))).toBe(true);
  });

  it('is deterministic with a seeded RNG', () => {
    const a = generateSyntheticPopulation(bases, 30, 0.1, createRng(999));
    const b = generateSyntheticPopulation(bases, 30, 0.1, createRng(999));
    expect(a).toEqual(b);
  });

  it('throws when vector lengths mismatch', () => {
    expect(() => generateSyntheticPopulation([[1], [1, 2]], 5)).toThrow(/same length/);
  });
});
