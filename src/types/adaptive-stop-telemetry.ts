import type { ResolvedAdaptiveMode } from '@/lib/adaptive-mode-resolution';

export type AdaptiveCompletionReason =
  | 'confidence_met'
  | 'max_questions'
  | 'user_exit'
  | 'diminishing_returns';

/** Persisted on {@link StoredPipelineSession} for offline psychometric analysis. */
export type AdaptiveStopTelemetry = {
  schemaVersion: 1;
  completionReason: AdaptiveCompletionReason;
  adaptiveMode: ResolvedAdaptiveMode;
  questionsAnswered: number;
  coreQuestionsAnswered: number;
  refinementQuestionsAnswered: number;
  phase: 'core' | 'refinement' | 'complete';
  /** Last values from profile-confidence trace (profile_diagnostic mode). */
  profileConfidenceTraceTail?: number[];
  marginalSessionConfidenceGain?: number | null;
  profileSessionConfidence?: number;
  profileMeanContradiction01?: number;
};
