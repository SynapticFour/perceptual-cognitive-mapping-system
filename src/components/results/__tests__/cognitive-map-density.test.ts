import { describe, expect, it } from 'vitest';
import { computeDensityGrid, smoothDensityGrid } from '@/core/cognitive-pipeline';

describe('computeDensityGrid', () => {
  it('bins points into cells', () => {
    const { grid, cols, rows } = computeDensityGrid([{ x: 0.1, y: 0.1 }], 80, 80, 10);
    expect(cols).toBe(8);
    expect(rows).toBe(8);
    let sum = 0;
    for (const row of grid) for (const v of row) sum += v;
    expect(sum).toBe(1);
  });
});

describe('smoothDensityGrid', () => {
  it('spreads mass to neighbors', () => {
    const g = [
      [0, 0, 0],
      [0, 9, 0],
      [0, 0, 0],
    ];
    const s = smoothDensityGrid(g, 1);
    expect(s[1][1]).toBeLessThan(9);
    expect(s[0][1] + s[1][0] + s[1][2] + s[2][1]).toBeGreaterThan(0);
  });
});
