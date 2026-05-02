import type { AssessmentQuestion } from '@/data/questions';
import { QUESTION_STEMS_DE } from '@/i18n/question-stems-de';

/**
 * Display text for a question in the UI locale. Scoring and history still use `question.id` and bank English text in storage.
 */
export function resolveQuestionDisplayText(question: AssessmentQuestion, uiLocale: string): string {
  if (uiLocale === 'de') {
    const t = QUESTION_STEMS_DE[question.id];
    if (t) return t;
  }
  return question.text;
}
