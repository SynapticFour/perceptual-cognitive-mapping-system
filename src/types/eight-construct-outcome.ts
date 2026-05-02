import type { EightConstructId } from '@/model/eight-constructs';

/** Persisted with {@link StoredPipelineSession} when the assessment used `g8:` items (global behavioral bank). */
export const EIGHT_CONSTRUCT_OUTCOME_VERSION = '1.0' as const;

/**
 * Single-session descriptive scores for one of eight constructs.
 * Reliability (ω, α) is a **sample-level** property; see `docs/VALIDATION_ROADMAP.md` and `docs/EIGHT_CONSTRUCT_MODEL.md`.
 * `meanSemWithinPerson` is SD(items)/√n for this administration (not sampling SE across people).
 */
export interface EightConstructScaleScore {
  construct: EightConstructId;
  nItems: number;
  /** Mean of reverse-adjusted, scale-normalized item scores in [0,1]; null if no items. */
  mean01: number | null;
  /**
   * Within-person spread of item scores (descriptive; high = heterogeneous endorsement across items).
   */
  withinPersonItemSd: number | null;
  /** SD(items)/√n for this session’s items on this construct (descriptive precision of the item mean). */
  meanSemWithinPerson: number | null;
}

export interface EightConstructOutcome {
  schemaVersion: typeof EIGHT_CONSTRUCT_OUTCOME_VERSION;
  /** Identifier of the item bank used for these scores. */
  bankId: 'global_behavioral_v2';
  scales: Record<EightConstructId, EightConstructScaleScore>;
}
