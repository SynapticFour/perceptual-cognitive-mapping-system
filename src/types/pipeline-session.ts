import type { ProfileAdaptiveSessionSummary } from '@/adaptive/profile-adaptive';
import type { ResolvedAdaptiveMode } from '@/lib/adaptive-mode-resolution';
import type { QuestionStemRegion } from '@/data/questions';
import type { CognitiveProfilePublic } from '@/types/profile-public';
import type { ScoringResult } from '@/scoring';
import type { EightConstructOutcome } from '@/types/eight-construct-outcome';

export const PIPELINE_STORAGE_VERSION = 3 as const;

/**
 * Optional fields passed into {@link import('@/lib/cognitive-pipeline').toStoredPipelineSession}.
 * All optional persisted keys remain backward-compatible with older clients.
 */
export type SessionPersistenceMeta = {
  sessionId?: string;
  revision?: number;
  eightConstructScores?: EightConstructOutcome | null;
  /** Within-session profile diagnostics (contradiction / variance); see `docs/RESEARCH-ROADMAP.md` Epic B. */
  profileAdaptiveSummary?: ProfileAdaptiveSessionSummary | null;
  /** Regional stem bundle active in the UI when the session completed. */
  stemRegionUsed?: QuestionStemRegion;
  /** Inferred bank id (e.g. `cultural-adaptive-v1`). */
  questionBankId?: string;
  /** Bank content revision string. */
  bankVersion?: string;
  /** Which adaptive selection policy was active for this session (authoritative research record). */
  adaptiveMode?: ResolvedAdaptiveMode;
  /** When true, deployment required `profile_diagnostic` and lossy share flows should have been disabled. */
  researchMode?: boolean;
};

/**
 * Persisted outcome of the research pipeline (full trace: interpretation + latent + scoring).
 *
 * **Authoritative research record** for this deployment: prefer this object (or `full-session.json`)
 * over share links / `LandscapeSharePayload` for analysis and reproducibility.
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
  /**
   * Present when the session used global behavioral `g8:` items; orthogonal to F–V routing scores.
   * See `docs/EIGHT_CONSTRUCT_MODEL.md`.
   */
  eightConstructScores?: EightConstructOutcome;
  /** Copy of {@link SessionPersistenceMeta.profileAdaptiveSummary} when saved. */
  profileAdaptiveSummary?: ProfileAdaptiveSessionSummary;
  stemRegionUsed?: QuestionStemRegion;
  questionBankId?: string;
  bankVersion?: string;
  adaptiveMode?: ResolvedAdaptiveMode;
  researchMode?: boolean;
}
