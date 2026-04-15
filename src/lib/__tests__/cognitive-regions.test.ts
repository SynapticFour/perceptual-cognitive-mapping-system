import { describe, expect, it } from 'vitest';
import { computeCognitiveRegions, convexHull2d, regionBoundaryPoints } from '@/lib/cognitive-regions';
import type { CognitiveActivation } from '@/core/traits/types';

function act(
  traitId: string,
  domain: CognitiveActivation['domain'],
  x: number,
  y: number,
  w: number
): { activation: CognitiveActivation; pt: { x: number; y: number } } {
  return {
    activation: { traitId, domain, vector: [], weight: w },
    pt: { x, y },
  };
}

describe('cognitive-regions', () => {
  it('splits two well-separated groups into two regions', () => {
    const a = act('t_a', 'cognition', 0.15, 0.2, 0.5);
    const b = act('t_b', 'cognition', 0.18, 0.22, 0.5);
    const c = act('t_c', 'social', 0.82, 0.78, 0.5);
    const d = act('t_d', 'social', 0.85, 0.8, 0.5);
    const activations = [a, b, c, d].map((x) => x.activation);
    const pts = [a, b, c, d].map((x) => x.pt);
    const { regions, validation } = computeCognitiveRegions(activations, pts);
    expect(regions.length).toBeGreaterThanOrEqual(2);
    expect(regions.length).toBeLessThanOrEqual(5);
    expect(validation.maxRegionWeightShare).toBeLessThanOrEqual(0.6 + 1e-6);
    expect(validation.maxRegionPointShare).toBeLessThanOrEqual(0.6 + 1e-6);
    expect(validation.regionCount).toBe(regions.length);
    const sets = regions.map((r) => new Set(r.pointIndices));
    const union = new Set<number>();
    for (const s of sets) {
      for (const i of s) union.add(i);
    }
    expect(union.size).toBe(4);
    expect(regions.every((r) => r.label.length > 0)).toBe(true);
  });

  it('convexHull2d returns a polygon for 3+ non-collinear points', () => {
    const h = convexHull2d([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0.5, y: 0.8 },
    ]);
    expect(h.length).toBeGreaterThanOrEqual(3);
  });

  it('regionBoundaryPoints handles singleton and pair', () => {
    const one = regionBoundaryPoints([{ x: 0.5, y: 0.5 }], 0.5);
    expect(one.length).toBe(4);
    const two = regionBoundaryPoints(
      [
        { x: 0.2, y: 0.2 },
        { x: 0.8, y: 0.8 },
      ],
      0.5
    );
    expect(two.length).toBe(4);
  });
});
