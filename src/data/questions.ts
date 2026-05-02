import { COGNITIVE_DIMENSION_KEYS, type CognitiveDimension } from '../model/cognitive-dimensions';
import { getQuestionBankSync } from './question-bank-state';

export type LikertResponse = 1 | 2 | 3 | 4 | 5;

/** `likert3` items use responses 1–3 (audio-friendly); still stored as LikertResponse. */
export type ResponseScale = 'likert5' | 'likert3';

export interface QuestionResponse {
  questionId: string;
  response: LikertResponse;
  timestamp: Date;
  responseTimeMs: number;
}

/**
 * Shape of each entry in `content/questions/{locale}/*.json` after JSON Schema validation.
 * Normalized to {@link AssessmentQuestion} at load time (camelCase routing weights).
 */
export interface QuestionBankJsonEntry {
  id: string;
  text: string;
  dimension_weights: Partial<Record<CognitiveDimension, number>>;
  type: 'core' | 'refinement';
  difficulty: 'broad' | 'specific';
  tags: string[];
  culturalContext: 'universal' | 'ghana' | 'western';
  informationGain: number;
  reverseScored: boolean;
  /** Defaults to 5-point agreement scale; `likert3` uses three ordered options (low literacy / audio). */
  responseScale?: ResponseScale;
  /**
   * IRT 2PL discrimination parameter. Null until calibrated on ≥200 pilot responses.
   * When populated, the adaptive engine should weight this question's information gain
   * using the IRT information function rather than the static informationGain field.
   */
  irt_a?: number | null;
  /**
   * IRT 2PL difficulty parameter (logit scale). Null until calibrated.
   */
  irt_b?: number | null;
}

export type AssessmentQuestionCategory =
  | 'focus'
  | 'pattern'
  | 'sensory'
  | 'social'
  | 'structure'
  | 'flexibility';

const QUESTION_CATEGORY_VALUES: AssessmentQuestionCategory[] = [
  'focus',
  'pattern',
  'sensory',
  'social',
  'structure',
  'flexibility',
];

function categoryFromTags(tags: string[]): AssessmentQuestionCategory {
  for (const tag of tags) {
    if (QUESTION_CATEGORY_VALUES.includes(tag as AssessmentQuestionCategory)) {
      return tag as AssessmentQuestionCategory;
    }
  }
  return 'focus';
}

/** Canonical question record for routing, scoring, and UI. */
export interface AssessmentQuestion {
  id: string;
  text: string;
  category: AssessmentQuestionCategory;
  /** Opaque routing loadings (keys F…V); not a public cognitive representation. */
  /**
   * IMPORTANT: dimensionWeights are PILOT ESTIMATES set by subject-matter experts.
   * They are NOT derived from empirical IRT calibration. Once pilot data is available
   * (n ≥ 200 per cultural context), replace with calibrated irt_a / irt_b parameters.
   * See docs/VALIDATION_ROADMAP.md for the planned calibration study design.
   */
  dimensionWeights: Record<string, number>;
  informationGain: number;
  type: 'core' | 'refinement';
  difficulty: 'broad' | 'specific';
  tags: string[];
  culturalContext?: 'western' | 'ghana' | 'universal';
  /** When true, Likert responses are inverted (1↔5) after normalisation before scoring. */
  reverseScored?: boolean;
  responseScale?: ResponseScale;
}

/** Map a schema-valid JSON row into the in-memory assessment shape. */
export function jsonEntryToAssessmentQuestion(row: QuestionBankJsonEntry): AssessmentQuestion {
  return {
    id: row.id,
    text: row.text,
    category: categoryFromTags(row.tags),
    dimensionWeights: Object.fromEntries(
      COGNITIVE_DIMENSION_KEYS.map((k) => [k, row.dimension_weights[k] ?? 0])
    ) as Record<CognitiveDimension, number>,
    informationGain: row.informationGain,
    type: row.type,
    difficulty: row.difficulty,
    tags: row.tags,
    culturalContext: row.culturalContext,
    reverseScored: row.reverseScored,
    responseScale: row.responseScale,
  };
}

/** Synchronous view of the active question bank (primed via `loadQuestions` or tests). */
export function getQuestionsSync(): AssessmentQuestion[] {
  return getQuestionBankSync();
}

/**
 * Questions filtered by cultural context (all types) for routing coverage and scoring.
 */
export function getQuestionsForContext(context: 'western' | 'ghana' | 'universal' = 'universal'): AssessmentQuestion[] {
  return getAssessmentQuestions('all', context);
}

export function normalizeLikertResponse(response: LikertResponse, scale: ResponseScale = 'likert5'): number {
  if (scale === 'likert3') {
    const r = Math.min(3, Math.max(1, response));
    return (r - 1) / 2;
  }
  return (response - 1) / 4;
}

export function denormalizeToLikert(value: number): LikertResponse {
  const clamped = Math.max(0, Math.min(1, value));
  return Math.round(clamped * 4 + 1) as LikertResponse;
}

export function getAssessmentQuestions(
  type: 'core' | 'refinement' | 'all' = 'all',
  context: 'western' | 'ghana' | 'universal' = 'universal'
): AssessmentQuestion[] {
  const bank = getQuestionBankSync();
  const questions: AssessmentQuestion[] = [];

  for (const q of bank) {
    if (type !== 'all' && q.type !== type) continue;
    if (q.culturalContext === 'universal' || q.culturalContext === context || q.culturalContext === undefined) {
      questions.push(q);
    }
  }

  return questions;
}

export function getQuestionsForDimensions(
  dimensions: string[],
  type: 'core' | 'refinement' | 'all' = 'all',
  excludeIds: string[] = []
): AssessmentQuestion[] {
  const allQuestions = getAssessmentQuestions(type);

  return allQuestions.filter((q) => {
    if (excludeIds.includes(q.id)) return false;

    return dimensions.some((dim) => {
      const w = q.dimensionWeights[dim];
      return w !== undefined && w > 0.3;
    });
  });
}

export function getPrimaryDimension(question: AssessmentQuestion): string | null {
  const weights = question.dimensionWeights;
  let maxWeight = 0;
  let primaryDim: string | null = null;

  for (const [dim, weight] of Object.entries(weights)) {
    if (weight && weight > maxWeight) {
      maxWeight = weight;
      primaryDim = dim;
    }
  }

  return primaryDim;
}
