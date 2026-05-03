import { describe, expect, it } from 'vitest';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { buildCognitiveModel } from '@/core/cognitive-pipeline';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import {
  analyzeMultiProfileGroup,
  clusterMembersByRoutingVectors,
  type GroupMemberInput,
} from '@/lib/group-cognitive-analysis';
import type { ConfidenceComponents } from '@/scoring';
function mockDisplay(value: number): DimensionDisplayModel {
  const rawPercent = Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, value])) as DimensionDisplayModel['rawPercent'];
  const weightedPercent = { ...rawPercent };
  const itemsContributing = Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 1])) as DimensionDisplayModel['itemsContributing'];
  return { rawPercent, weightedPercent, itemsContributing };
}

const mockConfidence: ConfidenceComponents = Object.fromEntries(
  ROUTING_WEIGHT_KEYS.map((d) => [
    d,
    {
      effectiveEvidence: 1,
      reliability: 1,
      consistency: 1,
      finalConfidence: 0.75,
      meetsMinimumSample: true,
    },
  ])
) as ConfidenceComponents;

function makeMember(id: string, label: string, raw: number, seed: number): GroupMemberInput {
  const display = mockDisplay(raw);
  const model = buildCognitiveModel({
    embeddingVector: new Array(32).fill(0).map((_, i) => (((i + seed) % 7) + Math.sin(seed)) / 14),
    embeddingDimension: 32,
    display,
    confidenceComponents: mockConfidence,
    syntheticCount: 48,
  });
  return { id, label, model, display };
}

describe('group-cognitive-analysis', () => {
  it('clusterMembersByRoutingVectors assigns every row', () => {
    const pts = [
      [0.2, 0.2, 0.8],
      [0.8, 0.2, 0.2],
      [0.5, 0.5, 0.5],
    ];
    const a = clusterMembersByRoutingVectors(pts, 2);
    expect(a).toHaveLength(3);
    expect(a.every((x) => x === 0 || x === 1)).toBe(true);
  });

  it('analyzeMultiProfileGroup returns diversity and clusters for two members', () => {
    const a = makeMember('m0', 'A', 45, 1);
    const b = makeMember('m1', 'B', 55, 2);
    const r = analyzeMultiProfileGroup([a, b]);
    expect(r.memberCount).toBe(2);
    expect(r.diversity.score).toBeGreaterThanOrEqual(0);
    expect(r.diversity.routingProfileEntropy01).toBeGreaterThanOrEqual(0);
    expect(r.diversity.routingProfileEntropy01).toBeLessThanOrEqual(1);
    expect(r.clusters.length).toBeGreaterThanOrEqual(1);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.recommendationItems.length).toBeGreaterThan(0);
    expect(r.summaryNarrative.length).toBeGreaterThan(40);
  });

  it('environment stress triggers structure_need_chaotic_env and structured rec', () => {
    const a = makeMember('m0', 'A', 62, 1);
    const b = makeMember('m1', 'B', 62, 2);
    const env = { predictability01: 0.32, stimulation01: 0.2, interruption01: 0.2 };
    const r = analyzeMultiProfileGroup([a, b], { environment: env });
    expect(r.environment).toEqual(env);
    expect(r.risks.some((x) => x.id === 'structure_need_chaotic_env')).toBe(true);
    expect(r.recommendationItems.some((x) => x.id === 'rec_temporal_visible_sequence')).toBe(true);
  });

  it('throws when fewer than two members', () => {
    expect(() => analyzeMultiProfileGroup([makeMember('m0', 'A', 50, 1)])).toThrow(/at least two/);
  });
});
