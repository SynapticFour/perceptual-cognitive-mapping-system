import type { CognitiveDimension, CognitiveVector } from '@/model/cognitive-dimensions';

/**
 * Anonymised row for psychometric / SPSS / R export (no PII).
 * Scores are unit-interval [0, 1] per routing dimension unless noted otherwise.
 */
export interface AssessmentSession {
  /** Opaque pseudonym (e.g. hash); not a user id. */
  anonId: string;
  culturalContext: 'western' | 'ghana' | 'universal';
  completedAt: string;
  responseCount: number;
  scores: CognitiveVector;
  confidence: CognitiveVector;
}

export interface ValidityResult {
  r: number;
  /** Two-tailed approximate p-value from t-test on Pearson r (df = n − 2). */
  pApprox: number;
  n: number;
  interpretation: string;
}

export interface CorrelationMatrix {
  dimensions: CognitiveDimension[];
  /** Symmetric matrix; row i, col j = Pearson r between dimension i and j across persons. */
  matrix: number[][];
}

export interface ContextGroupStats {
  culturalContext: AssessmentSession['culturalContext'];
  n: number;
  meanResponseCount: number;
  dimensionScoreMeans: CognitiveVector;
  dimensionConfidenceMeans: CognitiveVector;
}

export interface ContextStatistics {
  groups: ContextGroupStats[];
}

export interface SimulationResult {
  nRuns: number;
  meanRMSE: number;
  rmseByRun: number[];
  /** Mean(estimated − true) per dimension across runs. */
  meanBias: CognitiveVector;
}
