/** Cohort Intelligence Layer — aggregate, probabilistic, non-stigmatizing group views. */

export { buildCohortCognitiveMap } from '@/cohort/cohort-cognitive-map';
export { deriveEnvironmentSignals, cohortTraitShares } from '@/cohort/environment-signals';
export { mapInteractionFriction, DEFAULT_FRICTION_PAIRS } from '@/cohort/interaction-friction';
export { matchCohortToKnownPatterns } from '@/cohort/pattern-cohort-match';
export {
  validateCohortPayloadCopy,
  validateCohortModelView,
  validateEnvironmentSignals,
  validateFrictionSignals,
  assertNoIndividualPayload,
  BANNED_DIAGNOSTIC_TERMS,
} from '@/cohort/cohort-validation';

/**
 * Individual-level support hints — use only in private / authorized flows.
 * Never render alongside cohort aggregates or public exports.
 */
export { computeEarlySupportSignals } from '@/cohort/early-support-signals';

export type {
  CohortModel,
  CohortRegion,
  CohortSpreadMetrics,
  EnvironmentSignal,
  FrictionSignal,
  EarlySupportSignal,
  EarlySupportSignalType,
  CohortValidationResult,
} from '@/cohort/types';

export {
  getPatternLibrarySnapshot,
  getTopPatterns,
  recordUserSignatureWithContext,
  type PatternLibrarySnapshot,
} from '@/core/patterns/pattern-store';
