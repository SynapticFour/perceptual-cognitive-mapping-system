import type { SessionRaw } from '@/types/raw-session';
import type { SessionStatsInternal } from '@/types/session-stats';

/**
 * Internal-only session statistics (includes raw responses).
 * UI must use `toPublicSessionStats` from `@/types/session-stats`.
 */
export function getSessionStats(session: SessionRaw): SessionStatsInternal {
  const { responses, sessionId } = session;
  const responseTimesMs = responses.map((r) => r.responseTime);
  const categoriesCovered = [...new Set(responses.map((r) => r.questionContext.category))];
  const durationMs =
    responses.length >= 2
      ? responses[responses.length - 1]!.timestamp - responses[0]!.timestamp
      : 0;
  const averageResponseTimeMs =
    responses.length > 0
      ? responseTimesMs.reduce((a, b) => a + b, 0) / responses.length
      : 0;
  const totalAnswerChanges = responses.reduce((s, r) => s + (r.answerChanges ?? 0), 0);

  return {
    sessionId,
    responseCount: responses.length,
    durationMs,
    averageResponseTimeMs,
    categoriesCovered,
    rawResponses: responses,
    responseTimesMs,
    totalAnswerChanges
  };
}
