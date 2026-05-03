import { computeProfileAdaptiveSnapshot, toProfileAdaptiveSessionSummary } from '@/adaptive';
import type { QuestionResponse } from '@/data/questions';
import { getAssessmentQuestions } from '@/data/questions';
import {
  buildScoringResultFromHistory,
  buildSessionRawFromHistory,
  createResearchQuestionResolver,
  runResearchPipeline,
  toStoredPipelineSession,
} from '@/lib/cognitive-pipeline';
import { displayStemRegionForUiLocale } from '@/lib/regional-stem-resolution';
import { inferQuestionBankMeta } from '@/lib/session-bank-meta';
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
  const questionsById = new Map(getAssessmentQuestions('all', 'universal').map((q) => [q.id, q]));
  const profileAdaptiveSummary = toProfileAdaptiveSessionSummary(
    computeProfileAdaptiveSnapshot(options.history, questionsById)
  );
  const { questionBankId, bankVersion } = inferQuestionBankMeta(options.history, questionsById);
  return toStoredPipelineSession(pipeline, options.history.length, new Date().toISOString(), scoringResult, {
    sessionId: options.sessionId,
    profileAdaptiveSummary,
    stemRegionUsed: displayStemRegionForUiLocale('en'),
    questionBankId,
    bankVersion,
    adaptiveMode: 'routing_coverage',
    researchMode: false,
  });
}
