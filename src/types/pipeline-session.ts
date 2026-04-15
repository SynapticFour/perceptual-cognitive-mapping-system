import type { CognitiveProfilePublic } from '@/types/profile-public';
import type { ScoringResult } from '@/scoring';

export const PIPELINE_STORAGE_VERSION = 3 as const;

/**
 * Persisted outcome of the research pipeline (full trace: interpretation + latent + scoring).
 */
export interface StoredPipelineSession {
  version: typeof PIPELINE_STORAGE_VERSION;
  /** Stable browser session id (matches `pcms-session-id` when present). */
  sessionId?: string;
  /** Increments on each completed save for the same `sessionId` (refinement rounds). */
  revision?: number;
  completedAt: string;
  responseCount: number;
  publicProfile: CognitiveProfilePublic;
  embedding: {
    dimension: number;
    version: string;
    confidence: number;
    vector: number[];
  };
  featureHighlights: {
    overallConfidence: number;
    answerConsistency: number;
    entropy: number;
  };
  /** Per-dimension routing confidence (methods appendix). */
  scoringResult: ScoringResult;
}
