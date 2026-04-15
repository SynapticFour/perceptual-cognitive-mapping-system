import type { AssessmentQuestion } from '@/data/questions';

/**
 * Maps in-memory `dimensionWeights` to the JSONB payload stored on `question_responses.dimension_weights`.
 */
export function assessmentDimensionWeightsToDbJson(
  weights: AssessmentQuestion['dimensionWeights']
): Record<string, number> {
  return { ...weights };
}
