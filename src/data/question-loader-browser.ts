import { setQuestionBank } from './question-bank-state';
import type { SupportedLocale } from './question-locale-types';
import type { AssessmentQuestion } from './questions';
import { getQuestionBankCache, putQuestionBankCache } from '@/lib/offline-storage';

export type { SupportedLocale } from './question-locale-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Minimal structural check for `/api/questions` JSON (already validated on the server). */
function assertAssessmentQuestionBank(data: unknown, label: string): asserts data is AssessmentQuestion[] {
  if (!Array.isArray(data)) {
    throw new Error(`${label}: expected array`);
  }
  for (const row of data) {
    if (!isRecord(row)) throw new Error(`${label}: invalid row`);
    if (typeof row.id !== 'string' || typeof row.text !== 'string') throw new Error(`${label}: invalid row`);
    if (!isRecord(row.dimensionWeights)) throw new Error(`${label}: missing dimensionWeights`);
  }
}

/**
 * Loads the question bank in the browser via `/api/questions` and primes the sync cache.
 */
export async function loadQuestions(locale: SupportedLocale): Promise<AssessmentQuestion[]> {
  const params = new URLSearchParams({ locale, type: 'all' });
  const url = `/api/questions?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load questions: HTTP ${res.status}`);
    }
    const data: unknown = await res.json();
    assertAssessmentQuestionBank(data, `fetch /api/questions?locale=${locale}`);
    setQuestionBank(data);
    void putQuestionBankCache(locale, 'all', data);
    return data;
  } catch (e) {
    const cached = await getQuestionBankCache(locale, 'all');
    if (cached && cached.length > 0) {
      setQuestionBank(cached);
      return cached;
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
}
