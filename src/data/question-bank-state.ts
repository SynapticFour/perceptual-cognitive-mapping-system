import type { AssessmentQuestion } from './questions';

let questionBank: AssessmentQuestion[] | null = null;

export function setQuestionBank(questions: AssessmentQuestion[]): void {
  questionBank = questions;
}

export function getQuestionBankSync(): AssessmentQuestion[] {
  if (!questionBank) {
    throw new Error(
      'Question bank is not loaded. Call loadQuestions() after app startup, or setQuestionBank() after fetching /api/questions.'
    );
  }
  return questionBank;
}
