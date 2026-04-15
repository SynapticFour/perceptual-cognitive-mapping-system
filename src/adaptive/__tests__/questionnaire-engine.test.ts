import { describe, it, expect } from 'vitest';
import { AdaptiveQuestionnaireEngine, ENGINE_HARD_CAP_TOTAL_QUESTIONS } from '@/adaptive';
import { getAssessmentQuestions } from '@/data/questions';
import type { QuestionResponse } from '@/data/questions';

describe('AdaptiveQuestionnaireEngine', () => {
  it('resumeFrom re-hydrates history, enters refinement, and honours focus dimensions', () => {
    const core = getAssessmentQuestions('core', 'universal').slice(0, 3);
    expect(core.length).toBeGreaterThanOrEqual(2);
    const history: QuestionResponse[] = core.map((q, i) => ({
      questionId: q.id,
      response: 3,
      timestamp: new Date(`2026-01-0${i + 1}T12:00:00Z`),
      responseTimeMs: 500 + i,
    }));

    const eng = new AdaptiveQuestionnaireEngine('universal');
    eng.resumeFrom(history, ['F']);

    const s = eng.getState();
    expect(s.phase).toBe('refinement');
    expect(s.questionHistory).toHaveLength(3);
    expect(s.answeredQuestions.size).toBe(3);
    expect(s.completionReason).toBeNull();
    expect(s.isComplete).toBe(false);
    expect(eng.getRefinementFocusDimensions()).toEqual(['F']);
    expect(s.questionPath).toEqual(history.map((h) => h.questionId));
  });

  it('resumeFrom without focus can continue with selectNextQuestion', () => {
    const core = getAssessmentQuestions('core', 'universal').slice(0, 2);
    const history: QuestionResponse[] = core.map((q, i) => ({
      questionId: q.id,
      response: 3,
      timestamp: new Date(`2026-02-0${i + 1}T12:00:00Z`),
      responseTimeMs: 400,
    }));
    const eng = new AdaptiveQuestionnaireEngine('universal');
    eng.resumeFrom(history);
    expect(eng.getRefinementFocusDimensions()).toBeNull();
    const next = eng.selectNextQuestion();
    expect(next).not.toBeNull();
  });

  it('enforces the total-question hard cap (configurable in tests)', () => {
    const core = getAssessmentQuestions('core', 'universal');
    const first = core[0]!;
    const history: QuestionResponse[] = [
      {
        questionId: first.id,
        response: 3,
        timestamp: new Date(),
        responseTimeMs: 100,
      },
    ];

    const eng = new AdaptiveQuestionnaireEngine('universal', { totalQuestionHardCap: 2 });
    eng.resumeFrom(history);

    const q = eng.selectNextQuestion();
    expect(q).not.toBeNull();
    eng.submitResponse({
      questionId: q!.id,
      response: 4,
      timestamp: new Date(),
      responseTimeMs: 120,
    });

    expect(eng.selectNextQuestion()).toBeNull();
    const done = eng.getState();
    expect(done.isComplete).toBe(true);
    expect(done.completionReason).toBe('max_questions');
    expect(done.questionHistory.length).toBe(2);
  });

  it('exports production hard cap constant', () => {
    expect(ENGINE_HARD_CAP_TOTAL_QUESTIONS).toBe(30);
  });
});
