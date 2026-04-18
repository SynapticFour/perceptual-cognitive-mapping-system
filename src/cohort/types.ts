import type { TraitDomain } from '@/core/traits/trait-domains';

/** Aggregate region in shared 2D space (no individual identifiers). */
export type CohortRegion = {
  id: string;
  centroid: { x: number; y: number };
  /** Sum of activation weights in this region. */
  weight: number;
  /** Normalized trait mass within the region (sums to ~1). */
  traitDistribution: Record<string, number>;
  topTraitIds: string[];
  primaryDomain: TraitDomain;
};

export type CohortSpreadMetrics = {
  spanX: number;
  spanY: number;
  varianceX: number;
  varianceY: number;
};

/** Group-level cognitive map — safe for aggregate display only. */
export type CohortModel = {
  regions: CohortRegion[];
  diversityIndex: number;
  /** Normalized shares of the strongest constructs at cohort level. */
  dominantTraits: { traitId: string; share: number }[];
  spreadMetrics: CohortSpreadMetrics;
  /** 0–1: higher = more even spread across regions (entropy-based). */
  regionBalance: number;
  /** Normalized 2D coordinates (one per pooled activation). */
  cohortPoints: { x: number; y: number }[];
  cohortWeights: number[];
  /** Short rationale for interpretability (non-clinical). */
  summaryExplanation: string;
};

export type EnvironmentSignal = {
  id: string;
  /** 0–1 aggregate intensity. */
  intensity: number;
  /** 0–1 confidence from sample size / variance of inputs. */
  confidence: number;
  /** Non-prescriptive wording (may / tends to / benefit). */
  narrative: string;
  explanation: string;
};

export type FrictionSignal = {
  traits: [string, string];
  strength: number;
  /** Non-blaming, aggregate-only explanation. */
  explanation: string;
  suggestion: string;
};

export type EarlySupportSignalType = 'activation_peak' | 'field_imbalance' | 'rare_pattern_resonance';

/**
 * Individual-level hints for authorized contexts only — never bundle into public cohort payloads.
 * @private
 */
export type EarlySupportSignal = {
  type: EarlySupportSignalType;
  confidence: number;
  suggestion: string;
  explanation: string;
};

export type CohortValidationResult = {
  passesNoIndividualExposure: boolean;
  passesNonDiagnosticLanguage: boolean;
  passesAggregateOnly: boolean;
  bannedTermHits: string[];
  issues: string[];
  interpretabilityNotes: string[];
};
