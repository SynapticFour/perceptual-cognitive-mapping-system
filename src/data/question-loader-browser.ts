import { setQuestionBank } from './question-bank-state';
import type { SupportedLocale } from './question-locale-types';
import type { AssessmentQuestion } from './questions';
import { assertAssessmentQuestionBank } from '@/lib/question-bank-import';
import { getQuestionBankCache, putQuestionBankCache } from '@/lib/offline-storage';

export type { SupportedLocale } from './question-locale-types';

/** Static banks shipped under `public/data/` (see `npm run export-public-bank`). */
const STATIC_BANK_PATH: Partial<Record<SupportedLocale, string>> = {
  universal: '/data/question-bank-universal-all.json',
};

async function tryLoadStaticBank(locale: SupportedLocale): Promise<AssessmentQuestion[] | null> {
  const path = STATIC_BANK_PATH[locale];
  if (!path) return null;
  try {
    const res = await fetch(path, { cache: 'force-cache' });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    assertAssessmentQuestionBank(data, `static ${path}`);
    return data;
  } catch {
    return null;
  }
}

/**
 * Loads the question bank: `/api/questions` when available, else IndexedDB cache, else static JSON under `/data/`.
 * Primes IndexedDB after successful API or static load.
 */
export async function loadQuestions(locale: SupportedLocale): Promise<AssessmentQuestion[]> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const cached = await getQuestionBankCache(locale, 'all');
    if (cached && cached.length > 0) {
      setQuestionBank(cached);
      return cached;
    }
    const st = await tryLoadStaticBank(locale);
    if (st && st.length > 0) {
      setQuestionBank(st);
      void putQuestionBankCache(locale, 'all', st);
      return st;
    }
    throw new Error(
      'OFFLINE_NO_BANK: No cached question bank. Connect once, import a bank JSON file on the questionnaire page, or use an install that includes /data/question-bank-universal-all.json.'
    );
  }

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
    const st = await tryLoadStaticBank(locale);
    if (st && st.length > 0) {
      setQuestionBank(st);
      void putQuestionBankCache(locale, 'all', st);
      return st;
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
}
