import { loadQuestionsFromDiskImpl } from './question-loader-fs';
import { setQuestionBank } from './question-bank-state';
import type { SupportedLocale } from './question-locale-types';
import type { AssessmentQuestion } from './questions';

export type { SupportedLocale } from './question-locale-types';

/**
 * Loads and validates the question bank from disk (Node.js only).
 * Loads `content/questions/universal/` for en/de/universal; adds `ghana/` for ghana/gh-en.
 */
export async function loadQuestionsFromDisk(locale: string): Promise<AssessmentQuestion[]> {
  return loadQuestionsFromDiskImpl(locale);
}

/**
 * Node-only: loads from disk and updates the in-memory bank.
 * Client code must use `loadQuestions` from `./question-loader-browser` instead.
 */
export async function loadQuestions(locale: SupportedLocale): Promise<AssessmentQuestion[]> {
  const questions = await loadQuestionsFromDiskImpl(locale);
  setQuestionBank(questions);
  return questions;
}
