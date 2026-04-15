/**
 * Application-level barrel (library-style imports). Prefer `@/adaptive`, `@/scoring`, `@/model` in app code.
 */

export { AdaptiveQuestionnaireEngine, ENGINE_HARD_CAP_TOTAL_QUESTIONS } from '@/adaptive';
export { ScoringModel, calculateResearchConfidence, tagCoverageFromScoringResult } from '@/scoring';
export { LatentRepresentationManager } from '@/model';
export type { AssessmentQuestion, QuestionResponse, LikertResponse } from '@/data/questions';
