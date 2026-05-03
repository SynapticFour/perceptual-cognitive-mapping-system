import { describe, expect, it } from 'vitest';
import type { AssessmentQuestion, QuestionResponse } from '@/data/questions';
import { CULTURAL_ADAPTIVE_BANK_TAG } from '@/lib/cultural-adaptive-bank';
import { inferQuestionBankMeta } from '@/lib/session-bank-meta';

function qr(id: string): QuestionResponse {
  return {
    questionId: id,
    response: 3,
    timestamp: new Date('2026-01-01T00:00:00Z'),
    responseTimeMs: 1000,
  };
}

describe('inferQuestionBankMeta', () => {
  it('detects cultural-adaptive-v1 from bank tag', () => {
    const q = {
      id: 'ca-v1-sensory_regulation-001',
      tags: [CULTURAL_ADAPTIVE_BANK_TAG, 'sensory'],
    } as unknown as AssessmentQuestion;
    const byId = new Map<string, AssessmentQuestion>([[q.id, q]]);
    expect(inferQuestionBankMeta([qr(q.id)], byId)).toEqual({
      questionBankId: 'cultural-adaptive-v1',
      bankVersion: '1',
    });
  });

  it('detects global behavioral from g8 id prefix', () => {
    const q = { id: 'g8:foo:001', tags: [] } as unknown as AssessmentQuestion;
    const byId = new Map<string, AssessmentQuestion>([[q.id, q]]);
    expect(inferQuestionBankMeta([qr(q.id)], byId)).toEqual({
      questionBankId: 'global_behavioral_v2',
      bankVersion: '2',
    });
  });

  it('detects routing classic when neither cultural nor g8', () => {
    const q = { id: 'F-core-001', tags: ['focus'] } as unknown as AssessmentQuestion;
    const byId = new Map<string, AssessmentQuestion>([[q.id, q]]);
    expect(inferQuestionBankMeta([qr(q.id)], byId)).toEqual({
      questionBankId: 'routing_classic',
      bankVersion: '1',
    });
  });

  it('returns mixed when banks are combined', () => {
    const a = { id: 'ca-v1-001', tags: [CULTURAL_ADAPTIVE_BANK_TAG] } as unknown as AssessmentQuestion;
    const b = { id: 'F-core-001', tags: [] } as unknown as AssessmentQuestion;
    const byId = new Map<string, AssessmentQuestion>([
      [a.id, a],
      [b.id, b],
    ]);
    expect(inferQuestionBankMeta([qr(a.id), qr(b.id)], byId).questionBankId).toBe('mixed');
  });
});
