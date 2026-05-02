import {
  buildScoringResultFromHistory,
  buildSessionRawFromHistory,
  createResearchQuestionResolver,
  runResearchPipeline,
  toStoredPipelineSession,
} from '@/lib/cognitive-pipeline';
import type { QuestionResponse } from '@/data/questions';
import type { StoredPipelineSession } from '@/types/pipeline-session';

/**
 * Replays the same scoring path as an in-app session from paper/CSV-captured responses.
 */
export async function runPaperImportPipeline(options: {
  history: QuestionResponse[];
  sessionId: string;
}): Promise<StoredPipelineSession> {
  if (options.history.length === 0) {
    throw new Error('No responses to score');
  }
  const resolve = createResearchQuestionResolver('universal');
  const sessionRaw = buildSessionRawFromHistory(options.sessionId, options.history, resolve);
  if (sessionRaw.responses.length === 0) {
    throw new Error('No responses matched the loaded question bank (check questionId values).');
  }
  const pipeline = await runResearchPipeline(sessionRaw);
  const scoringResult = buildScoringResultFromHistory(options.history, 'universal');
  return toStoredPipelineSession(pipeline, options.history.length, new Date().toISOString(), scoringResult, {
    sessionId: options.sessionId,
  });
}
