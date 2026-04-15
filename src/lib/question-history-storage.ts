import type { LikertResponse, QuestionResponse } from '@/data/questions';

function isLikert(n: number): n is LikertResponse {
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

/** Reads persisted questionnaire answers from `localStorage` (client only). */
export function readQuestionHistoryFromStorage(): QuestionResponse[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('pcms-question-history');
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: QuestionResponse[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      if (typeof r.questionId !== 'string') continue;
      if (typeof r.response !== 'number' || !isLikert(r.response)) continue;
      const ts = r.timestamp;
      const date =
        typeof ts === 'string'
          ? new Date(ts)
          : ts instanceof Date
            ? ts
            : new Date();
      const rt = r.responseTimeMs;
      out.push({
        questionId: r.questionId,
        response: r.response,
        timestamp: date,
        responseTimeMs: typeof rt === 'number' && Number.isFinite(rt) ? rt : 0,
      });
    }
    return out;
  } catch {
    return [];
  }
}
