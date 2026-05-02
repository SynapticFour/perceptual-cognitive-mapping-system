/**
 * Barrel exports — prefer importing from specific modules in new code.
 */

export type { RawResponse, SessionRaw } from '@/types/raw-session';
export type {
  SessionStatsInternal,
  SessionStatsPublic,
} from '@/types/session-stats';
export { toPublicSessionStats } from '@/types/session-stats';
export type { CognitiveProfilePublic } from '@/types/profile-public';

export type { AssessmentQuestion, LikertResponse, QuestionResponse } from '@/data/questions';
export type { StoredPipelineSession } from '@/types/pipeline-session';
export type {
  EightConstructOutcome,
  EightConstructScaleScore,
} from '@/types/eight-construct-outcome';
