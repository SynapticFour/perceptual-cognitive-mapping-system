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
  validateAggregateStructure,
  validateCohortIntelligenceBundle,
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

export type {
  GuidanceInsight,
  GuidanceRecommendation,
  InteractionDynamicsItem,
  InsightConfidenceBand,
} from '@/cohort/ux-types';
export { MAX_GUIDANCE_INSIGHTS, MAX_EARLY_SUPPORT_SIGNALS_UI } from '@/cohort/ux-types';
export { sanitizeGuidanceText, clampInsightList } from '@/cohort/ux-copy-safety';
export {
  buildGuidanceInsights,
  buildGuidanceRecommendations,
  buildInteractionDynamics,
  describeCohortRegionForTooltip,
  numericToConfidenceBand,
} from '@/cohort/ux-insights';

export {
  getPatternLibrarySnapshot,
  getTopPatterns,
  recordUserSignatureWithContext,
  type PatternLibrarySnapshot,
} from '@/core/patterns/pattern-store';

/** Alias matching documentation: global pattern store snapshot (`patterns`, `lastUpdated`, `totalSignatures`). */
export type { PatternLibrarySnapshot as PatternLibrary } from '@/core/patterns/pattern-store';
