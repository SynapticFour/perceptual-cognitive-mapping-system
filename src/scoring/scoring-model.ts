import type { AssessmentQuestion, QuestionResponse } from '@/data/questions';
import { normalizeLikertResponse } from '@/data/questions';
import {
  ROUTING_WEIGHT_KEYS,
  type TagCoverageVector,
  emptyTagCoverage,
} from '@/adaptive/routing-tags';
import type { CognitiveDimension } from '@/model/cognitive-dimensions';

export type { CognitiveDimension };

const VARIANCE_WEIGHT_THRESHOLD = 0.3;
const STRONG_WEIGHT_THRESHOLD = 0.5;

export interface DimensionConfidenceComponent {
  effectiveEvidence: number;
  reliability: number;
  consistency: number;
  finalConfidence: number;
  meetsMinimumSample: boolean;
}

export type ConfidenceComponents = Record<CognitiveDimension, DimensionConfidenceComponent>;

export interface ScoringResult {
  confidenceComponents: ConfidenceComponents;
}

export interface ScoringModelConfig {
  /** Spearman–Brown style pseudo-evidence shrinkage prior (default 0.5). */
  priorPseudoEvidence: number;
  /**
   * Maximum confidence value returned for any dimension.
   * Default 0.75 — prevents overconfidence in small-sample research context.
   * Override for simulation or sensitivity studies only.
   */
  researchConfidenceCap: number;
}

const DEFAULT_SCORING_CONFIG: ScoringModelConfig = {
  priorPseudoEvidence: 0.5,
  researchConfidenceCap: 0.75,
};

/**
 * Applies reverse scoring to a normalised Likert value in [0, 1].
 */
export function adjustedNormalizedResponse(normalizedResponse: number, reverseScored: boolean): number {
  const clamped = Math.max(0, Math.min(1, normalizedResponse));
  return reverseScored ? 1 - clamped : clamped;
}

/**
 * Weighted contribution of one routing dimension before aggregation.
 */
export function dimensionContribution(
  normalizedResponse: number,
  question: Pick<AssessmentQuestion, 'dimensionWeights' | 'reverseScored'>,
  dimension: string
): number {
  const adjusted = adjustedNormalizedResponse(normalizedResponse, question.reverseScored ?? false);
  const w = question.dimensionWeights[dimension] ?? 0;
  return adjusted * w;
}

function clampConsistency(c: number): number {
  return Math.max(0.5, Math.min(1, c));
}

function populationVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
}

/**
 * Calculates research confidence using CTT-style evidence accumulation with Bayesian shrinkage.
 * 
 * This implements a sophisticated confidence model that combines multiple statistical factors:
 * 1. Evidence Strength: Weighted sum of squared dimension weights (classical test theory)
 * 2. Reliability: Bayesian shrinkage using pseudo-evidence prior (prevents overconfidence)
 * 3. Consistency: Response variance penalty (detects contradictory patterns)
 * 4. Sample Size Gate: Minimum strong-weight questions required (research validity)
 * 
 * The algorithm follows these steps for each cognitive dimension:
 * - Accumulate evidence from question dimension weights
 * - Apply Bayesian shrinkage to prevent overconfidence with small samples
 * - Calculate response consistency through variance analysis
 * - Apply minimum sample requirements for research validity
 * - Cap confidence at 0.75 until sufficient evidence is collected
 * 
 * @param responses - Array of question responses with timing data
 * @param questionsById - Map of question metadata for weight lookup and processing
 * @param config - Optional configuration for prior evidence weighting
 * @returns Confidence components for each cognitive dimension with detailed metrics
 * 
 * @example
 * ```typescript
 * const confidence = calculateResearchConfidence(responses, questionsById);
 * console.log(confidence.confidenceComponents.F.finalConfidence); // 0.82
 * console.log(confidence.confidenceComponents.F.meetsMinimumSample); // true
 * ```
 */
export function calculateResearchConfidence(
  responses: QuestionResponse[],
  questionsById: Map<string, AssessmentQuestion>,
  config: Partial<ScoringModelConfig> = {}
): ScoringResult {
  // Prior pseudo-evidence for Bayesian shrinkage (default 0.5)
  // Higher values = more conservative confidence estimates
  const k = config.priorPseudoEvidence ?? DEFAULT_SCORING_CONFIG.priorPseudoEvidence;
  const confidenceComponents = {} as ConfidenceComponents;

  // Calculate confidence for each cognitive dimension independently
  for (const d of ROUTING_WEIGHT_KEYS) {
    let effectiveEvidence = 0; // Accumulated evidence strength
    const weightedAdjusted: number[] = []; // Weighted, normalized responses for variance calculation
    let strongCount = 0; // Count of questions with strong weight (> 0.5)

    // Process each response to accumulate evidence and prepare consistency analysis
    for (const qr of responses) {
      const q = questionsById.get(qr.questionId);
      if (!q) continue; // Skip unknown questions

      const w = q.dimensionWeights[d] ?? 0; // Get dimension weight for this question
      
      // Evidence accumulation: sum of squared weights (classical test theory)
      effectiveEvidence += w * w;

      // Count strong-weight questions for sample size requirements
      if (w >= STRONG_WEIGHT_THRESHOLD) {
        strongCount += 1;
      }

      // Collect weighted responses for consistency analysis
      if (w >= VARIANCE_WEIGHT_THRESHOLD) {
        const norm = normalizeLikertResponse(qr.response, q.responseScale ?? 'likert5'); // Convert to [0,1]
        const adjusted = adjustedNormalizedResponse(norm, q.reverseScored ?? false); // Apply reverse scoring
        weightedAdjusted.push(adjusted * w); // Weight by dimension strength
      }
    }

    // Reliability calculation with Bayesian shrinkage
    // Formula: evidence / (evidence + prior_pseudo_evidence)
    // This prevents overconfidence with small samples
    const reliability =
      effectiveEvidence + k > 0 ? effectiveEvidence / (effectiveEvidence + k) : 0;

    // Consistency calculation based on response variance
    // Lower variance = higher consistency
    let consistency = 1; // Perfect consistency by default
    if (weightedAdjusted.length >= 2) {
      const v = populationVariance(weightedAdjusted); // Calculate population variance
      consistency = 1 - v; // Convert variance to consistency score
    }

    // Sample size validation for research validity
    const meetsMinimumSample = strongCount >= 2; // Require at least 2 strong-weight questions
    
    // Combine reliability and consistency
    const combined = reliability * clampConsistency(consistency);
    
    // Apply confidence cap until minimum sample is met
    // This is a research safeguard: cap at 0.75 until sufficient evidence
    const finalConfidence = meetsMinimumSample
      ? combined
      : Math.min(combined, config.researchConfidenceCap ?? DEFAULT_SCORING_CONFIG.researchConfidenceCap);

    confidenceComponents[d] = {
      effectiveEvidence,
      reliability,
      consistency,
      finalConfidence,
      meetsMinimumSample,
    };
  }

  return { confidenceComponents };
}

/** Maps scoring output to the coverage vector used by the adaptive engine UI and thresholds. */
export function tagCoverageFromScoringResult(result: ScoringResult): TagCoverageVector {
  const out = emptyTagCoverage();
  for (const d of ROUTING_WEIGHT_KEYS) {
    out[d] = result.confidenceComponents[d].finalConfidence;
  }
  return out;
}

export class ScoringModel {
  private readonly config: ScoringModelConfig;

  constructor(config: Partial<ScoringModelConfig> = {}) {
    this.config = { ...DEFAULT_SCORING_CONFIG, ...config };
  }

  get priorPseudoEvidence(): number {
    return this.config.priorPseudoEvidence;
  }

  get researchConfidenceCap(): number {
    return this.config.researchConfidenceCap;
  }

  evaluate(responses: QuestionResponse[], questionsById: Map<string, AssessmentQuestion>): ScoringResult {
    return calculateResearchConfidence(responses, questionsById, this.config);
  }
}
