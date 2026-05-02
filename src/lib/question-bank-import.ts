import { setQuestionBank } from '@/data/question-bank-state';
import type { AssessmentQuestion } from '@/data/questions';
import { putQuestionBankCache } from '@/lib/offline-storage';
import type { SupportedLocale } from '@/data/question-locale-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Same structural check as `question-loader-browser` (client-safe). */
export function assertAssessmentQuestionBank(data: unknown, label: string): asserts data is AssessmentQuestion[] {
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
 * Apply a user-supplied question bank (e.g. USB JSON) into memory and IndexedDB cache.
 */
export async function applyImportedQuestionBank(
  data: unknown,
  locale: SupportedLocale,
  type: string = 'all'
): Promise<AssessmentQuestion[]> {
  assertAssessmentQuestionBank(data, 'imported question bank');
  setQuestionBank(data);
  await putQuestionBankCache(locale, type, data);
  return data;
}
