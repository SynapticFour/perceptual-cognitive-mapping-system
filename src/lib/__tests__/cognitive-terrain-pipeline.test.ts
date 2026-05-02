import { describe, expect, it } from 'vitest';
import { densityGridToHeightmap, sampleDensityGridBilinear } from '@/lib/cognitive-terrain-pipeline';

describe('cognitive-terrain-pipeline', () => {
  it('sampleDensityGridBilinear interpolates corners', () => {
    const grid = [
      [0, 10],
      [20, 30],
    ];
    expect(sampleDensityGridBilinear(grid, 2, 2, 0, 0)).toBeCloseTo(20, 5);
    expect(sampleDensityGridBilinear(grid, 2, 2, 1, 1)).toBeCloseTo(10, 5);
    expect(sampleDensityGridBilinear(grid, 2, 2, 0.5, 0.5)).toBeCloseTo(15, 5);
  });

  it('densityGridToHeightmap normalises by maxD', () => {
    const grid = [
      [0, 4],
      [4, 8],
    ];
    const hm = densityGridToHeightmap(grid, 2, 2, 8, 2);
    expect(hm.length).toBe(9);
    expect(Math.max(...hm)).toBeLessThanOrEqual(1.0001);
    expect(Math.min(...hm)).toBeGreaterThanOrEqual(0);
  });
});
