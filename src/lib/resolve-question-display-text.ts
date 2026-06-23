import type { AssessmentQuestion } from '@/data/questions';
import { QUESTION_STEMS_DE } from '@/i18n/question-stems-de';
import { QUESTION_STEMS_DE_TIAV } from '@/i18n/question-stems-de-tiav';
import { QUESTION_STEMS_FR } from '@/i18n/question-stems-fr';
import { QUESTION_STEMS_SW } from '@/i18n/question-stems-sw';
import { displayStemRegionForUiLocale, resolveStemForRegion } from '@/lib/regional-stem-resolution';

const UI_STEM_MAP: Record<string, Record<string, string>> = {
  de: { ...QUESTION_STEMS_DE, ...QUESTION_STEMS_DE_TIAV },
  fr: QUESTION_STEMS_FR,
  sw: QUESTION_STEMS_SW,
};

/**
 * Display text for a question in the UI locale. Scoring and history still use `question.id` only.
 */
export function resolveQuestionDisplayText(question: AssessmentQuestion, uiLocale: string): string {
  const stems = UI_STEM_MAP[uiLocale];
  if (stems) {
    const t = stems[question.id];
    if (t) return t;
  }
  if (question.stemVariants) {
    return resolveStemForRegion(question, displayStemRegionForUiLocale(uiLocale));
  }
  return question.text;
}
