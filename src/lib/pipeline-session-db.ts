import type { Json } from '@/types/database.types';
import { PIPELINE_STORAGE_VERSION, type StoredPipelineSession } from '@/types/pipeline-session';

type PipelineSessionRow = {
  session_id: string;
  pipeline_storage_version: number;
  assessment_version: string;
  completed_at: string;
  trait_vector: Json;
  confidence: Json;
  contradiction: Json | null;
  question_bank_id: string | null;
  bank_version: string | null;
  adaptive_mode: 'routing_coverage' | 'profile_diagnostic' | null;
  region_info: string | null;
  response_count: number;
  revision: number | null;
  final_profile: Json;
};

function asIso(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) throw new Error('invalid_completed_at');
  return d.toISOString();
}

function toAdaptiveMode(input: StoredPipelineSession['adaptiveMode']): PipelineSessionRow['adaptive_mode'] {
  if (input === 'routing_coverage' || input === 'profile_diagnostic') return input;
  return null;
}

/**
 * Build normalized pipeline_sessions row from StoredPipelineSession.
 * Throws on invalid/missing critical fields so callers can fallback to offline queueing.
 */
export function toPipelineSessionRow(
  sessionId: string,
  assessmentVersion: string,
  stored: StoredPipelineSession
): PipelineSessionRow {
  if (!sessionId || sessionId.length < 8) throw new Error('invalid_session_id');
  if (!assessmentVersion || assessmentVersion.trim().length < 2) throw new Error('invalid_assessment_version');
  if (!stored || stored.version !== PIPELINE_STORAGE_VERSION) throw new Error('invalid_pipeline_storage_version');
  if (!Number.isFinite(stored.responseCount) || stored.responseCount < 1) throw new Error('invalid_response_count');

  const contradiction =
    stored.profileAdaptiveSummary
      ? ({
          sessionConfidence: stored.profileAdaptiveSummary.sessionConfidence,
          meanContradiction01: stored.profileAdaptiveSummary.meanContradiction01,
          byDimension: stored.profileAdaptiveSummary.byDimension,
        } as Json)
      : null;

  return {
    session_id: sessionId,
    pipeline_storage_version: stored.version,
    assessment_version: assessmentVersion.trim(),
    completed_at: asIso(stored.completedAt),
    trait_vector: ({
      embedding: stored.embedding,
      scoringResult: stored.scoringResult,
      eightConstructScores: stored.eightConstructScores ?? null,
    } as unknown) as Json,
    confidence: ({
      interpretationConfidence: stored.publicProfile.confidence,
      embeddingConfidence: stored.embedding.confidence,
      highlights: stored.featureHighlights,
    } as unknown) as Json,
    contradiction,
    question_bank_id: stored.questionBankId ?? null,
    bank_version: stored.bankVersion ?? null,
    adaptive_mode: toAdaptiveMode(stored.adaptiveMode),
    region_info: stored.stemRegionUsed ?? null,
    response_count: stored.responseCount,
    revision: typeof stored.revision === 'number' ? stored.revision : null,
    final_profile: stored as unknown as Json,
  };
}
