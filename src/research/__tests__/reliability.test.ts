import { describe, it, expect } from 'vitest';

import { cronbachAlpha, icc, itemTotalCorrelation, splitHalfReliability } from '@/research/reliability';

describe('reliability', () => {
  it('cronbachAlpha is high when items are parallel', () => {
    const items = [
      [2, 2, 2],
      [3, 3, 3],
      [4, 4, 4],
      [5, 5, 5],
    ];
    const a = cronbachAlpha(items);
    expect(a).toBeGreaterThan(0.95);
  });

  it('icc reflects agreement between sessions', () => {
    const s1 = [1, 2, 3, 4];
    const s2 = [1.1, 2.1, 2.9, 4.2];
    const v = icc(s1, s2);
    expect(v).toBeGreaterThan(0.9);
  });

  it('itemTotalCorrelation is near one for a perfectly aligned item', () => {
    const item = [1, 2, 3, 4, 5];
    const total = [2, 4, 6, 8, 10];
    const r = itemTotalCorrelation(item, total);
    expect(r).toBeGreaterThan(0.99);
  });

  it('splitHalfReliability uses Spearman–Brown on correlated halves', () => {
    const scores = [
      [1, 1, 2, 2],
      [2, 2, 3, 3],
      [3, 3, 4, 4],
    ];
    const r = splitHalfReliability(scores);
    expect(r).toBeGreaterThan(0.95);
  });
});
