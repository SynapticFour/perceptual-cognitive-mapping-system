import { COGNITIVE_DIMENSION_KEYS, type CognitiveDimension } from '@/model/cognitive-dimensions';
import type { Json } from '@/types/database.types';
import type { ConfidenceComponents } from '@/scoring';
import { parseStoredPipelineSession } from '@/lib/parse-pipeline-session';

export type DimensionConfidenceRow = Record<CognitiveDimension, number>;

/**
 * Profiles store the full `StoredPipelineSession` in `cognitive_vector`.
 * For aggregate analytics we use per-dimension routing confidence (0–100), not clinical scores.
 */
export function extractDimensionConfidencesFromProfileJson(json: Json): DimensionConfidenceRow | null {
  const parsed = parseStoredPipelineSession(json as unknown);
  if (!parsed) return null;
  const cc = parsed.scoringResult?.confidenceComponents as ConfidenceComponents | undefined;
  if (!cc) return null;
  const out = {} as DimensionConfidenceRow;
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    const v = cc[d]?.finalConfidence;
    out[d] = typeof v === 'number' ? Math.round(v * 1000) / 10 : 0;
  }
  return out;
}

export function overallInterpretationConfidence(json: Json): number | null {
  const parsed = parseStoredPipelineSession(json as unknown);
  if (!parsed) return null;
  const c = parsed.publicProfile?.confidence;
  return typeof c === 'number' ? c : null;
}
