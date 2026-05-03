/**
 * Canonical **trait vector** for downstream analysis — one row per F–V routing dimension.
 *
 * **Not** the same as:
 * - **Embedding vector** (`StoredPipelineSession.embedding.vector`): latent geometry for interpretation / viz;
 *   not directly calibrated to Likert routing dimensions.
 * - **Routing display percentages** (from `buildDimensionDisplayModel` + history): behavioural emphasis on 0–100
 *   scales; recomputed from raw answers + bank weights — not fully duplicated inside `StoredPipelineSession` alone.
 *
 * This structure intentionally merges **scoring-model** evidence (`scoringResult`) with **profile-adaptive**
 * within-session contradiction when the latter was persisted on the session.
 */
import { ROUTING_WEIGHT_KEYS, type RoutingWeightKey } from '@/adaptive/routing-tags';
import type { StoredPipelineSession } from '@/types/pipeline-session';

export const TRAIT_VECTOR_SCHEMA_VERSION = 1 as const;

export type TraitVectorDimensionEntry = {
  /**
   * Evidence-strength scalar from the scoring model (0–1): `reliability` term
   * (`effectiveEvidence / (effectiveEvidence + prior))` — monotonic with accumulated item evidence,
   * not a preference direction on the scale.
   */
  score: number;
  /** `finalConfidence` from `calculateResearchConfidence` (0–1). */
  confidence: number;
  /** `contradiction01` from `profileAdaptiveSummary` when present; otherwise `null` if profile block was not saved. */
  contradiction: number | null;
};

export type CanonicalTraitVector = {
  schemaVersion: typeof TRAIT_VECTOR_SCHEMA_VERSION;
  dimensions: Record<RoutingWeightKey, TraitVectorDimensionEntry>;
};

export function buildTraitVector(session: StoredPipelineSession): CanonicalTraitVector {
  const pa = session.profileAdaptiveSummary?.byDimension;
  const dims = {} as Record<RoutingWeightKey, TraitVectorDimensionEntry>;
  for (const d of ROUTING_WEIGHT_KEYS) {
    const cc = session.scoringResult.confidenceComponents[d];
    const contra = pa?.[d]?.contradiction01;
    dims[d] = {
      score: cc.reliability,
      confidence: cc.finalConfidence,
      contradiction: typeof contra === 'number' && Number.isFinite(contra) ? contra : null,
    };
  }
  return { schemaVersion: TRAIT_VECTOR_SCHEMA_VERSION, dimensions: dims };
}
