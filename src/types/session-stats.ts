import type { RawResponse } from '@/types/raw-session';

/**
 * Internal session aggregates — includes raw responses (never send to UI/API).
 */
export interface SessionStatsInternal {
  sessionId: string;
  responseCount: number;
  durationMs: number;
  averageResponseTimeMs: number;
  categoriesCovered: string[];
  rawResponses: RawResponse[];
  responseTimesMs: number[];
  totalAnswerChanges: number;
}

/**
 * Public-safe session summary — no raw payloads.
 */
export interface SessionStatsPublic {
  sessionId: string;
  responseCount: number;
  durationMs: number;
  averageResponseTimeMs: number;
  categoriesCovered: string[];
  totalAnswerChanges?: number;
}

export function toPublicSessionStats(internal: SessionStatsInternal): SessionStatsPublic {
  return {
    sessionId: internal.sessionId,
    responseCount: internal.responseCount,
    durationMs: internal.durationMs,
    averageResponseTimeMs: internal.averageResponseTimeMs,
    categoriesCovered: [...internal.categoriesCovered],
    totalAnswerChanges: internal.totalAnswerChanges,
  };
}
