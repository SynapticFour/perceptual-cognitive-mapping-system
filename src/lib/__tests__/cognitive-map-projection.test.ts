import { describe, expect, it } from 'vitest';
import {
  activationSpatialDispersion,
  alignVectorToDim,
  liftRawPercentToEmbedding,
  normalizePlanarCoords,
  projectPointsTo2dPca,
  spreadActivationProjections,
} from '@/lib/cognitive-map-projection';

describe('cognitive-map-projection', () => {
  it('alignVectorToDim pads and truncates deterministically', () => {
    expect(alignVectorToDim([1, 2, 3], 5).length).toBe(5);
    expect(alignVectorToDim([1, 2, 3, 4, 5, 6], 4)).toEqual([1, 2, 3, 4]);
  });

  it('liftRawPercentToEmbedding produces fixed width', () => {
    const v = liftRawPercentToEmbedding({ F: 80, P: 20 }, 40);
    expect(v.length).toBe(40);
    expect(v.every((x) => x >= 0 && x <= 1)).toBe(true);
  });

  it('PCA spreads separated clusters in 2D', () => {
    const d = 12;
    const a = Array(d).fill(0);
    const b = [...a];
    b[0] = 10;
    const c = [...a];
    c[1] = 10;
    const pts = [a, b, c, b.map((_, i) => (i === 0 ? 10 : i === 1 ? 10 : 0))];
    const p = projectPointsTo2dPca(pts);
    expect(p.length).toBe(4);
    const n = normalizePlanarCoords(p, 0.05);
    const span =
      Math.max(...n.map((q) => q.nx)) -
      Math.min(...n.map((q) => q.nx)) +
      (Math.max(...n.map((q) => q.ny)) - Math.min(...n.map((q) => q.ny)));
    expect(span).toBeGreaterThan(0.2);
  });

  it('spreadActivationProjections widens a tight activation cluster in plot space', () => {
    const pts = [
      { x: 0.5, y: 0.5 },
      { x: 0.52, y: 0.51 },
      { x: 0.48, y: 0.49 },
    ];
    const span = (ps: { x: number; y: number }[]) =>
      Math.max(...ps.map((p) => p.x)) -
      Math.min(...ps.map((p) => p.x)) +
      (Math.max(...ps.map((p) => p.y)) - Math.min(...ps.map((p) => p.y)));
    const before = span(pts);
    spreadActivationProjections(pts, 3, [0.33, 0.33, 0.34], ['a', 'b', 'c']);
    const after = span(pts);
    expect(after).toBeGreaterThan(before);
    expect(after).toBeGreaterThan(0.12);
    for (const p of pts) {
      expect(p.x).toBeGreaterThan(0.03);
      expect(p.x).toBeLessThan(0.97);
      expect(p.y).toBeGreaterThan(0.03);
      expect(p.y).toBeLessThan(0.97);
    }
  });

  it('activationSpatialDispersion summarizes span and variance', () => {
    const pts = [
      { x: 0.2, y: 0.3 },
      { x: 0.8, y: 0.7 },
    ];
    const d = activationSpatialDispersion(pts, 2);
    expect(d.spanX).toBeCloseTo(0.6);
    expect(d.varianceX).toBeGreaterThan(0.05);
  });
});
