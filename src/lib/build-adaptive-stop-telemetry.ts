import type { AdaptiveQuestionnaireEngine } from '@/adaptive/questionnaire-engine';
import { marginalSessionConfidenceGain } from '@/adaptive/profile-adaptive';
import type { AdaptiveStopTelemetry } from '@/types/adaptive-stop-telemetry';

/** Build serializable stop telemetry from engine state at session end. */
export function buildAdaptiveStopTelemetry(
  eng: AdaptiveQuestionnaireEngine,
  completionReason: NonNullable<AdaptiveStopTelemetry['completionReason']>
): AdaptiveStopTelemetry {
  const stats = eng.getCompletionStats();
  const trace = eng.getProfileConfidenceTrace?.() ?? [];
  const tail = trace.length > 0 ? trace.slice(-5) : undefined;
  const cfg = eng.getProfileAdaptiveConfig?.();
  const window = cfg?.diminishingReturnsWindow ?? 5;
  const marginal = tail && tail.length >= 2 ? marginalSessionConfidenceGain(trace, window) : null;

  return {
    schemaVersion: 1,
    completionReason,
    adaptiveMode: eng.getAdaptiveMode(),
    questionsAnswered: stats.questionsAnswered,
    coreQuestionsAnswered: stats.coreQuestionsAnswered,
    refinementQuestionsAnswered: stats.refinementQuestionsAnswered,
    phase: stats.phase,
    profileConfidenceTraceTail: tail,
    marginalSessionConfidenceGain: marginal,
    profileSessionConfidence: stats.profileAdaptive?.sessionConfidence,
    profileMeanContradiction01: stats.profileAdaptive?.meanContradiction01,
  };
}
