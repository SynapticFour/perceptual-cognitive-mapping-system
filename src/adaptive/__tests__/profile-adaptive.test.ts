import { describe, it, expect } from 'vitest';

import type { AssessmentQuestion, QuestionResponse } from '@/data/questions';
import {
  buildProfileConfidenceTrace,
  computeProfileAdaptiveSnapshot,
  marginalSessionConfidenceGain,
  primaryRoutingKeyForProfile,
} from '@/adaptive/profile-adaptive';

function q(
  id: string,
  weights: Partial<Record<string, number>>,
  reverse: boolean,
  scale: 'likert3' | 'likert5' = 'likert3'
): AssessmentQuestion {
  const dimensionWeights: Record<string, number> = { F: 0, P: 0, S: 0, E: 0, R: 0, C: 0, T: 0, I: 0, A: 0, V: 0 };
  for (const [k, v] of Object.entries(weights)) {
    if (typeof v === 'number') dimensionWeights[k] = v;
  }
  return {
    id,
    text: id,
    category: 'focus',
    dimensionWeights,
    informationGain: 0.65,
    type: 'core',
    difficulty: 'broad',
    tags: ['focus'],
    culturalContext: 'universal',
    reverseScored: reverse,
    responseScale: scale,
  };
}

function resp(questionId: string, likert: 1 | 2 | 3): QuestionResponse {
  return {
    questionId,
    response: likert,
    timestamp: new Date('2026-01-01T00:00:00Z'),
    responseTimeMs: 100,
  };
}

describe('profile-adaptive', () => {
  it('buckets by primary routing key (argmax)', () => {
    const item = q('a', { F: 0.7, S: 0.1 }, false);
    expect(primaryRoutingKeyForProfile(item)).toBe('F');
  });

  it('detects high contradiction when reverse and non-reverse means diverge on same dimension', () => {
    const map = new Map<string, AssessmentQuestion>([
      ['n1', q('n1', { F: 0.7, S: 0.05 }, false)],
      ['n2', q('n2', { F: 0.72, S: 0.05 }, false)],
      ['r1', q('r1', { F: 0.7, S: 0.05 }, true)],
      ['r2', q('r2', { F: 0.72, S: 0.05 }, true)],
    ]);
    const history: QuestionResponse[] = [
      resp('n1', 3),
      resp('n2', 3),
      resp('r1', 3),
      resp('r2', 3),
    ];
    const snap = computeProfileAdaptiveSnapshot(history, map);
    const f = snap.byDimension.F;
    expect(f.n).toBe(4);
    expect(f.contradiction01).toBeGreaterThan(0.85);
    expect(f.confidence01).toBeLessThan(0.5);
  });

  it('buildProfileConfidenceTrace is monotonic in length and deterministic', () => {
    const map = new Map<string, AssessmentQuestion>([
      ['q1', q('q1', { T: 0.68, R: 0.1 }, false)],
      ['q2', q('q2', { T: 0.7, R: 0.1 }, true)],
    ]);
    const h: QuestionResponse[] = [resp('q1', 2), resp('q2', 2)];
    const trace = buildProfileConfidenceTrace(h, map);
    expect(trace).toHaveLength(2);
    expect(trace[0]).toBeGreaterThanOrEqual(0);
    expect(trace[1]).toBeGreaterThanOrEqual(0);
  });

  it('marginalSessionConfidenceGain returns null until window satisfied', () => {
    expect(marginalSessionConfidenceGain([0.5, 0.51], 5)).toBeNull();
    expect(marginalSessionConfidenceGain([0.5, 0.5, 0.5, 0.5, 0.5, 0.52], 5)).toBeCloseTo(0.02, 5);
  });
});
