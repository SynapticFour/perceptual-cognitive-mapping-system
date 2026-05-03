import type { AssessmentQuestion } from '@/data/questions';
import { QUESTION_STEMS_DE } from '@/i18n/question-stems-de';
import { displayStemRegionForUiLocale, resolveStemForRegion } from '@/lib/regional-stem-resolution';

/**
 * Display text for a question in the UI locale. Scoring and history still use `question.id` only.
 * When `question.stemVariants` is set (e.g. cultural-adaptive bank), English stem is chosen by
 * {@link displayStemRegionForUiLocale} with fallback to `global` inside {@link resolveStemForRegion}.
 */
export function resolveQuestionDisplayText(question: AssessmentQuestion, uiLocale: string): string {
  if (uiLocale === 'de') {
    const t = QUESTION_STEMS_DE[question.id];
    if (t) return t;
  }
  if (question.stemVariants) {
    return resolveStemForRegion(question, displayStemRegionForUiLocale(uiLocale));
  }
  return question.text;
}
