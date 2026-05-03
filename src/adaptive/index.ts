export { AdaptiveQuestionnaireEngine, ENGINE_HARD_CAP_TOTAL_QUESTIONS } from './questionnaire-engine';
export type { ResearchAssessmentConfig } from './questionnaire-engine';
export {
  computeProfileAdaptiveSnapshot,
  DEFAULT_PROFILE_ADAPTIVE_CONFIG,
  PROFILE_ADAPTIVE_SESSION_SUMMARY_VERSION,
  toProfileAdaptiveSessionSummary,
  type ProfileAdaptiveConfig,
  type ProfileAdaptiveSessionSummary,
  type ProfileAdaptiveSnapshot,
  type ProfileDimensionStats,
} from './profile-adaptive';
export { CoverageModel } from './coverage-model';
export {
  buildPerDimensionRoutingDiagnostics,
  type PerDimensionRoutingDiagnostics,
} from './routing-diagnostics';
export { ROUTING_WEIGHT_KEYS, emptyTagCoverage } from './routing-tags';
export type { RoutingWeightKey, TagCoverageVector } from './routing-tags';
