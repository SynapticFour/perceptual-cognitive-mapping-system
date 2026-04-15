import { describe, it, expect } from 'vitest';
import {
  buildScoringResultFromHistory,
  buildSessionRawFromHistory,
  createResearchQuestionResolver,
  runResearchPipeline,
  toStoredPipelineSession,
} from '@/lib/cognitive-pipeline';
import { PIPELINE_STORAGE_VERSION } from '@/types/pipeline-session';
import type { QuestionResponse } from '@/data/questions';

describe('cognitive-pipeline', () => {
  it('builds empty session without throwing', () => {
    const resolve = createResearchQuestionResolver();
    const session = buildSessionRawFromHistory('s1', [], resolve);
    expect(session.responses).toHaveLength(0);
  });

  it('maps questionnaire history to raw layer when questions resolve', async () => {
    const resolve = createResearchQuestionResolver();
    const first = resolve('F-core-001');
    expect(first).toBeDefined();
    const history: QuestionResponse[] = [
      {
        questionId: 'F-core-001',
        response: 4,
        timestamp: new Date('2026-01-01T12:00:00Z'),
        responseTimeMs: 2100,
      },
    ];
    const session = buildSessionRawFromHistory('s2', history, resolve);
    expect(session.responses).toHaveLength(1);
    expect(session.responses[0]?.selectedAnswer).toBe(4);
    expect(session.responses[0]?.questionContext.category).toBe('focus');

    const out = await runResearchPipeline(session, { targetDimension: 32 });
    expect(out.embedding.vector.length).toBe(32);
    expect(out.publicProfile.summary.length).toBeGreaterThan(0);

    const scoringResult = buildScoringResultFromHistory(history, 'universal');
    const stored = toStoredPipelineSession(out, 1, undefined, scoringResult);
    expect(stored.version).toBe(PIPELINE_STORAGE_VERSION);
    expect(stored.scoringResult.confidenceComponents.F.finalConfidence).toBeGreaterThanOrEqual(0);
    expect(stored.embedding.vector).toHaveLength(32);
    expect(stored.featureHighlights.entropy).toBeDefined();
  });
});
