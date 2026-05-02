import { describe, expect, it } from 'vitest';
import type { AssessmentQuestion } from '@/data/questions';
import type { QuestionResponse } from '@/data/questions';
import { computeEightConstructScores } from '@/scoring/eight-construct-scores';

function q(
  id: string,
  tags: string[],
  reverse = false,
  scale: 'likert3' | 'likert5' = 'likert3'
): AssessmentQuestion {
  return {
    id,
    text: 'x',
    category: 'focus',
    dimensionWeights: { F: 0.7, P: 0, S: 0, E: 0, R: 0, C: 0, T: 0, I: 0, A: 0, V: 0 },
    informationGain: 0.6,
    type: 'core',
    difficulty: 'broad',
    tags,
    culturalContext: 'universal',
    reverseScored: reverse,
    responseScale: scale,
  };
}

describe('computeEightConstructScores', () => {
  it('returns null when no g8 tags', () => {
    const byId = new Map<string, AssessmentQuestion>([
      ['x', q('x', ['focus'], false)],
    ]);
    const hist: QuestionResponse[] = [
      { questionId: 'x', response: 3, timestamp: new Date(), responseTimeMs: 1 },
    ];
    expect(computeEightConstructScores(hist, byId)).toBeNull();
  });

  it('aggregates one construct from tagged items', () => {
    const byId = new Map<string, AssessmentQuestion>([
      ['a', q('a', ['focus', 'g8:motivation', 'behavioral_v2'], false)],
      ['b', q('b', ['focus', 'g8:motivation', 'behavioral_v2'], true)],
    ]);
    const hist: QuestionResponse[] = [
      { questionId: 'a', response: 3, timestamp: new Date(), responseTimeMs: 1 },
      { questionId: 'b', response: 1, timestamp: new Date(), responseTimeMs: 1 },
    ];
    const out = computeEightConstructScores(hist, byId);
    expect(out).not.toBeNull();
    expect(out!.bankId).toBe('global_behavioral_v2');
    expect(out!.scales.motivation.nItems).toBe(2);
    expect(out!.scales.motivation.mean01).not.toBeNull();
    expect(out!.scales.sensory_processing.nItems).toBe(0);
  });
});
