import { describe, expect, it, beforeEach } from 'vitest';
import { minePatterns } from '@/core/patterns/pattern-mining';
import { describePatternTraits, matchUserToPatterns } from '@/core/patterns/pattern-matching';
import { getDiscoveredPatterns, recordUserSignature, resetPatternStoreForTests } from '@/core/patterns/pattern-store';
import { extractUserSignature } from '@/core/patterns/user-signature';
import type { CognitiveActivation } from '@/core/traits/types';

function act(id: string, w: number, domain: CognitiveActivation['domain'] = 'cognition'): CognitiveActivation {
  return { traitId: id, domain, vector: [], weight: w };
}

beforeEach(() => {
  resetPatternStoreForTests();
});

describe('extractUserSignature', () => {
  it('filters by weight and returns sorted ids', () => {
    const sig = extractUserSignature(
      [
        act('zebra', 0.9),
        act('apple', 0.5),
        act('mango', 0.35),
        act('low', 0.25),
      ],
      { topN: 6, weightMin: 0.3 }
    );
    expect(sig).toEqual(['apple', 'mango', 'zebra']);
  });
});

describe('minePatterns', () => {
  it('finds recurring pairs and triplets', () => {
    const sigs = [
      ['a', 'b', 'c'],
      ['a', 'b', 'd'],
      ['a', 'b', 'e'],
    ];
    const p = minePatterns(sigs);
    const ab = p.find((x) => x.traits.length === 2 && x.traits.includes('a') && x.traits.includes('b'));
    expect(ab?.support).toBe(3);
    const trip = p.find((x) => x.traits.length === 3);
    expect(trip).toBeUndefined();
  });
});

describe('matchUserToPatterns', () => {
  it('ranks patterns by overlap', () => {
    const patterns = minePatterns([
      ['x', 'y', 'z'],
      ['x', 'y', 'w'],
    ]);
    const m = matchUserToPatterns(['x', 'y', 'q'], patterns, 3);
    expect(m.length).toBeGreaterThan(0);
    expect(m[0]!.pattern.traits).toContain('x');
  });
});

describe('describePatternTraits', () => {
  it('uses readable trait labels', () => {
    expect(describePatternTraits(['novelty_seeking', 'sustained_focus'])).toContain('novelty seeking');
  });
});

describe('pattern-store', () => {
  it('accumulates signatures and exposes mined patterns', () => {
    recordUserSignature(['a', 'b']);
    recordUserSignature(['a', 'b']);
    const p = getDiscoveredPatterns();
    expect(p.some((x) => x.traits.join() === 'a,b' && x.support >= 2)).toBe(true);
  });
});
