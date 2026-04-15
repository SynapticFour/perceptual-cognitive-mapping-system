import { describe, it, expect } from 'vitest';

import { calculateResearchConfidence } from '@/scoring';
import { getAssessmentQuestions, type AssessmentQuestion, type QuestionResponse } from '@/data/questions';

function bankMaps(ids: string[]) {
  const all = getAssessmentQuestions('all', 'universal').filter((r) => ids.includes(r.id));
  const questionsById = new Map(all.map((r) => [r.id, r]));
  return { questionsById };
}

function mkAssessment(id: string, f: number, reverseScored = false): AssessmentQuestion {
  return {
    id,
    text: 'synthetic',
    category: 'focus',
    dimensionWeights: { F: f, P: 0, S: 0, E: 0, R: 0, C: 0 },
    informationGain: 0.5,
    type: 'core',
    difficulty: 'broad',
    tags: ['focus'],
    culturalContext: 'universal',
    reverseScored,
  };
}

function qr(questionId: string, response: 1 | 2 | 3 | 4 | 5): QuestionResponse {
  return {
    questionId,
    response,
    timestamp: new Date('2026-01-01T12:00:00Z'),
    responseTimeMs: 1000,
  };
}

describe('calculateResearchConfidence', () => {
  it('zero items yields zero reliability and confidence on F', () => {
    const { questionsById } = bankMaps([]);
    const { confidenceComponents } = calculateResearchConfidence([], questionsById);
    expect(confidenceComponents.F.effectiveEvidence).toBe(0);
    expect(confidenceComponents.F.reliability).toBe(0);
    expect(confidenceComponents.F.consistency).toBe(1);
    expect(confidenceComponents.F.finalConfidence).toBe(0);
    expect(confidenceComponents.F.meetsMinimumSample).toBe(false);
  });

  it('single bank item yields consistency 1 (variance undefined)', () => {
    const { questionsById } = bankMaps(['F-core-001']);
    const { confidenceComponents } = calculateResearchConfidence([qr('F-core-001', 4)], questionsById);
    expect(confidenceComponents.F.consistency).toBe(1);
    expect(confidenceComponents.F.meetsMinimumSample).toBe(false);
  });

  it('high spread on weighted adjusted responses lowers consistency on F', () => {
    const questionsById = new Map([
      ['a', mkAssessment('a', 1)],
      ['b', mkAssessment('b', 1)],
    ]);
    const { confidenceComponents } = calculateResearchConfidence([qr('a', 1), qr('b', 5)], questionsById);
    expect(confidenceComponents.F.consistency).toBeCloseTo(0.75, 5);
  });

  it('aligned responses keep consistency at 1 for F', () => {
    const questionsById = new Map([
      ['a', mkAssessment('a', 1)],
      ['b', mkAssessment('b', 1)],
    ]);
    const { confidenceComponents } = calculateResearchConfidence([qr('a', 4), qr('b', 4)], questionsById);
    expect(confidenceComponents.F.consistency).toBe(1);
  });

  it('caps final confidence at 0.75 until two items with w_F >= 0.5', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `syn_${i}`);
    const questionsById = new Map<string, AssessmentQuestion>();
    for (const id of ids) {
      questionsById.set(id, mkAssessment(id, 0.48));
    }
    const responses = ids.map((id) => qr(id, 5));
    const { confidenceComponents } = calculateResearchConfidence(responses, questionsById);
    expect(confidenceComponents.F.meetsMinimumSample).toBe(false);
    expect(confidenceComponents.F.reliability).toBeGreaterThan(0.75);
    expect(confidenceComponents.F.finalConfidence).toBe(0.75);
  });

  it('respects priorPseudoEvidence shrinkage', () => {
    const { questionsById } = bankMaps(['F-core-001']);
    const lowK = calculateResearchConfidence([qr('F-core-001', 4)], questionsById, {
      priorPseudoEvidence: 0.1,
    });
    const highK = calculateResearchConfidence([qr('F-core-001', 4)], questionsById, {
      priorPseudoEvidence: 2,
    });
    expect(lowK.confidenceComponents.F.reliability).toBeGreaterThan(highK.confidenceComponents.F.reliability);
  });
});
