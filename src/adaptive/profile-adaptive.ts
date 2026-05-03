/**
 * Offline, deterministic profile diagnostics for adaptive questioning:
 * per routing dimension (F–V): mean / variance / reverse-group contradiction, session confidence,
 * and scoring hooks for selection + stop rules.
 */

import type { AssessmentQuestion, QuestionResponse } from '@/data/questions';
import { normalizeLikertResponse } from '@/data/questions';
import { adjustedNormalizedResponse } from '@/scoring';
import { ROUTING_WEIGHT_KEYS, type RoutingWeightKey } from '@/adaptive/routing-tags';

export interface ProfileAdaptiveConfig {
  /** Saturation curve midpoint: ~nHalf answers approach full saturation term. */
  nHalfPerDimension: number;
  nCapPerDimension: number;
  wContradiction: number;
  /** Mean per-dimension confidence must reach this (over dims with ≥1 answer) to allow profile stop. */
  sessionConfidenceThreshold: number;
  diminishingReturnsWindow: number;
  diminishingReturnsEpsilon: number;
  /** Minimum answered items before profile-based session stop is allowed. */
  minTotalAnswersForProfileStop: number;
  /** Blend legacy core score with profile priority: 0 = profile only, 1 = legacy only. */
  coreLegacyBlend: number;
}

export const DEFAULT_PROFILE_ADAPTIVE_CONFIG: ProfileAdaptiveConfig = {
  nHalfPerDimension: 3,
  nCapPerDimension: 12,
  wContradiction: 1.0,
  sessionConfidenceThreshold: 0.78,
  diminishingReturnsWindow: 5,
  diminishingReturnsEpsilon: 0.012,
  minTotalAnswersForProfileStop: 14,
  coreLegacyBlend: 0.28,
};

export type ProfileDimensionStats = {
  n: number;
  mean01: number;
  variance01: number;
  /** Conflict between reverse vs non-reverse groups, mapped to [0,1]. */
  contradiction01: number;
  /** f(n, consistency, variance) in [0,1]. */
  confidence01: number;
};

export type ProfileAdaptiveSnapshot = {
  byDimension: Record<RoutingWeightKey, ProfileDimensionStats>;
  sessionConfidence: number;
  /** Mean contradiction over dimensions with n ≥ 1 (for diagnostics). */
  meanContradiction01: number;
};

/** Schema for {@link StoredPipelineSession.profileAdaptiveSummary} (JSON-serializable). */
export const PROFILE_ADAPTIVE_SESSION_SUMMARY_VERSION = 1 as const;

export type ProfileAdaptiveSessionSummary = {
  schemaVersion: typeof PROFILE_ADAPTIVE_SESSION_SUMMARY_VERSION;
  sessionConfidence: number;
  meanContradiction01: number;
  byDimension: Record<RoutingWeightKey, ProfileDimensionStats>;
};

/** Snapshot suitable for localStorage / Postgres `cognitive_vector` sidecar fields. */
export function toProfileAdaptiveSessionSummary(snap: ProfileAdaptiveSnapshot): ProfileAdaptiveSessionSummary {
  return {
    schemaVersion: PROFILE_ADAPTIVE_SESSION_SUMMARY_VERSION,
    sessionConfidence: snap.sessionConfidence,
    meanContradiction01: snap.meanContradiction01,
    byDimension: { ...snap.byDimension },
  };
}

function sampleVariance01(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  let s = 0;
  for (const v of values) {
    s += (v - mean) ** 2;
  }
  return s / (values.length - 1);
}

function clip01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function saturationAnswerCount(n: number, nHalf: number, nCap: number): number {
  const t = Math.min(1, n / Math.max(1, nHalf));
  const t2 = Math.min(1, n / Math.max(1, nCap));
  return t * t2;
}

/** Argmax routing key for bucketing (deterministic tie-break: F < P < … lex order in ROUTING_WEIGHT_KEYS). */
export function primaryRoutingKeyForProfile(question: AssessmentQuestion): RoutingWeightKey {
  let best: RoutingWeightKey = ROUTING_WEIGHT_KEYS[0];
  let max = -1;
  for (const k of ROUTING_WEIGHT_KEYS) {
    const w = question.dimensionWeights[k] ?? 0;
    if (w > max) {
      max = w;
      best = k;
    }
  }
  return best;
}

function codedScore(response: QuestionResponse, question: AssessmentQuestion): number {
  const scale = question.responseScale ?? 'likert5';
  const norm = normalizeLikertResponse(response.response, scale);
  return adjustedNormalizedResponse(norm, question.reverseScored ?? false);
}

function confidenceFromStats(
  n: number,
  variance01: number,
  contradiction01: number,
  cfg: ProfileAdaptiveConfig
): number {
  if (n <= 0) return 0;
  const sat = saturationAnswerCount(n, cfg.nHalfPerDimension, cfg.nCapPerDimension);
  const consistency = 1 - contradiction01;
  const meanUncertainty = Math.min(1, Math.sqrt(variance01 / Math.max(1, n)));
  return clip01(sat * consistency * (1 - meanUncertainty));
}

/**
 * Build per-dimension stats from answered history only (offline, deterministic).
 */
export function computeProfileAdaptiveSnapshot(
  responses: QuestionResponse[],
  questionsById: Map<string, AssessmentQuestion>,
  cfg: ProfileAdaptiveConfig = DEFAULT_PROFILE_ADAPTIVE_CONFIG
): ProfileAdaptiveSnapshot {
  type Bucket = { xs: number[]; nonRev: number[]; rev: number[] };
  const buckets: Record<RoutingWeightKey, Bucket> = {} as Record<RoutingWeightKey, Bucket>;
  for (const k of ROUTING_WEIGHT_KEYS) {
    buckets[k] = { xs: [], nonRev: [], rev: [] };
  }

  for (const r of responses) {
    const q = questionsById.get(r.questionId);
    if (!q) continue;
    const x = codedScore(r, q);
    const prim = primaryRoutingKeyForProfile(q);
    const b = buckets[prim];
    b.xs.push(x);
    if (q.reverseScored) b.rev.push(x);
    else b.nonRev.push(x);
  }

  const byDimension = {} as Record<RoutingWeightKey, ProfileDimensionStats>;
  let confSum = 0;
  let confCount = 0;
  let contraSum = 0;
  let contraCount = 0;

  for (const d of ROUTING_WEIGHT_KEYS) {
    const { xs, nonRev, rev } = buckets[d];
    const n = xs.length;
    let mean01 = 0.5;
    let variance01 = 0;
    let contradiction01 = 0;

    if (n > 0) {
      mean01 = xs.reduce((a, v) => a + v, 0) / n;
      variance01 = sampleVariance01(xs, mean01);
      if (nonRev.length > 0 && rev.length > 0) {
        const mP = nonRev.reduce((a, v) => a + v, 0) / nonRev.length;
        const mR = rev.reduce((a, v) => a + v, 0) / rev.length;
        contradiction01 = clip01(2 * Math.abs(mP - mR));
      } else {
        const sorted = [...xs].sort((a, b) => a - b);
        const med = sorted.length % 2 === 1 ? sorted[(sorted.length - 1) >> 1]! : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2;
        contradiction01 = clip01(2 * xs.reduce((a, v) => a + Math.abs(v - med), 0) / Math.max(1, n));
      }
    }

    const confidence01 = confidenceFromStats(n, variance01, contradiction01, cfg);
    byDimension[d] = {
      n,
      mean01: Math.round(mean01 * 10000) / 10000,
      variance01: Math.round(variance01 * 10000) / 10000,
      contradiction01: Math.round(contradiction01 * 10000) / 10000,
      confidence01: Math.round(confidence01 * 10000) / 10000,
    };

    if (n > 0) {
      confSum += confidence01;
      confCount += 1;
      contraSum += contradiction01;
      contraCount += 1;
    }
  }

  const sessionConfidence = confCount > 0 ? confSum / confCount : 0;
  const meanContradiction01 = contraCount > 0 ? contraSum / contraCount : 0;

  return {
    byDimension,
    sessionConfidence: Math.round(sessionConfidence * 10000) / 10000,
    meanContradiction01: Math.round(meanContradiction01 * 10000) / 10000,
  };
}

/** Priority for targeting a dimension (higher = more urgent to ask next). */
export function profileDimensionPriority(d: RoutingWeightKey, snap: ProfileAdaptiveSnapshot, cfg: ProfileAdaptiveConfig): number {
  const st = snap.byDimension[d];
  const urgency = 1 - st.confidence01 + cfg.wContradiction * st.contradiction01;
  return Math.round(urgency * 10000) / 10000;
}

/**
 * Deterministic core selection boost from profile snapshot (add to legacy score).
 * Tie-break: use question.id lexicographically in caller sort.
 */
export function profileCoreQuestionBoost(
  question: AssessmentQuestion,
  snap: ProfileAdaptiveSnapshot,
  cfg: ProfileAdaptiveConfig = DEFAULT_PROFILE_ADAPTIVE_CONFIG
): number {
  const prim = primaryRoutingKeyForProfile(question);
  return profileDimensionPriority(prim, snap, cfg);
}

export function profileRefinementQuestionBoost(
  question: AssessmentQuestion,
  targetTag: RoutingWeightKey,
  snap: ProfileAdaptiveSnapshot,
  cfg: ProfileAdaptiveConfig = DEFAULT_PROFILE_ADAPTIVE_CONFIG
): number {
  const prim = primaryRoutingKeyForProfile(question);
  const w = question.dimensionWeights[targetTag] ?? 0;
  const load = w >= 0.3 ? 1 : 0;
  const primBoost = prim === targetTag ? profileDimensionPriority(prim, snap, cfg) : profileDimensionPriority(prim, snap, cfg) * 0.35;
  return load * primBoost;
}

/**
 * Rebuild session-confidence trace after each prefix of history (for resume / diagnostics).
 */
export function buildProfileConfidenceTrace(
  history: QuestionResponse[],
  questionsById: Map<string, AssessmentQuestion>,
  cfg: ProfileAdaptiveConfig = DEFAULT_PROFILE_ADAPTIVE_CONFIG
): number[] {
  const trace: number[] = [];
  for (let i = 1; i <= history.length; i++) {
    const sub = history.slice(0, i);
    trace.push(computeProfileAdaptiveSnapshot(sub, questionsById, cfg).sessionConfidence);
  }
  return trace;
}

/** Gain over the last `window` answers; null if not enough history. */
export function marginalSessionConfidenceGain(trace: readonly number[], window: number): number | null {
  if (trace.length < window + 1) return null;
  const now = trace[trace.length - 1]!;
  const past = trace[trace.length - 1 - window]!;
  return now - past;
}
