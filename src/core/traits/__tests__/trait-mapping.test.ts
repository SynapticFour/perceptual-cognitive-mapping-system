import { describe, expect, it } from 'vitest';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import type { ConfidenceComponents } from '@/scoring';
import { TRAIT_DEFINITIONS } from '@/core/traits/trait-definitions';
import {
  activationContextSeed,
  clusterActivationProjections,
  mapAnswersToActivations,
  resolveTraitEdges,
} from '@/core/traits/trait-mapping';

const mockConfidence: ConfidenceComponents = Object.fromEntries(
  ROUTING_WEIGHT_KEYS.map((d) => [
    d,
    {
      effectiveEvidence: 1,
      reliability: 1,
      consistency: 1,
      finalConfidence: 0.85,
      meetsMinimumSample: true,
    },
  ])
) as ConfidenceComponents;

describe('activationContextSeed', () => {
  it('is stable for identical answers and embedding', () => {
    const rawPercent = Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 55])) as Record<string, number>;
    const emb = new Array(32).fill(0).map((_, i) => (i * 0.017) % 1);
    const a = {
      rawPercent,
      confidenceComponents: mockConfidence,
      embeddingDimension: 32,
      sessionEmbedding: emb,
    };
    expect(activationContextSeed(a)).toBe(activationContextSeed(a));
  });
});

describe('mapAnswersToActivations', () => {
  it('is deterministic for identical inputs', () => {
    const rawPercent = Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, d === 'P' ? 82 : 48])) as Record<
      string,
      number
    >;
    const args = {
      rawPercent,
      confidenceComponents: mockConfidence,
      embeddingDimension: 40,
      sessionEmbedding: new Array(40).fill(0).map((_, i) => ((i * 13) % 97) / 100),
    };
    const u = mapAnswersToActivations(args);
    const v = mapAnswersToActivations(args);
    expect(u.map((x) => x.traitId)).toEqual(v.map((x) => x.traitId));
    for (let i = 0; i < u.length; i++) {
      expect(u[i]!.weight).toBeCloseTo(v[i]!.weight!, 10);
      expect(u[i]!.vector).toEqual(v[i]!.vector);
    }
  });

  it('returns bounded activations with trait vectors in embedding dim', () => {
    const rawPercent = Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, d === 'P' ? 88 : 45])) as Record<
      string,
      number
    >;
    const out = mapAnswersToActivations({
      rawPercent,
      confidenceComponents: mockConfidence,
      embeddingDimension: 40,
      sessionEmbedding: null,
    });
    expect(out.length).toBe(TRAIT_DEFINITIONS.length);
    for (const a of out) {
      expect(a.traitId).toMatch(/^[a-z_]+$/);
      expect(a.domain).toMatch(/^[a-z]+$/);
      expect(a.vector.length).toBe(40);
      expect(a.weight).toBeGreaterThan(0);
      expect(a.weight).toBeLessThanOrEqual(1);
    }
  });
});

describe('resolveTraitEdges', () => {
  it('maps pairs to local indices when both traits present', () => {
    const ids = ['pattern_recognition', 'abstract_thinking', 'sustained_focus'];
    const edges = resolveTraitEdges(ids, [
      ['pattern_recognition', 'abstract_thinking'],
      ['pattern_recognition', 'missing_other'],
    ]);
    expect(edges).toEqual([[0, 1]]);
  });
});

describe('clusterActivationProjections', () => {
  it('groups close points by global index', () => {
    const pts = [
      { x: 0.1, y: 0.1 },
      { x: 0.11, y: 0.11 },
      { x: 0.9, y: 0.9 },
    ];
    const clusters = clusterActivationProjections([0, 1, 2], pts, 0.05);
    expect(clusters.some((g) => g.includes(0) && g.includes(1))).toBe(true);
    expect(clusters.flat().includes(2)).toBe(false);
  });
});
