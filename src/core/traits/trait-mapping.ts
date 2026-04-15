import { alignVectorToDim, liftRawPercentToEmbedding } from '@/lib/cognitive-map-projection';
import type { ConfidenceComponents } from '@/scoring';
import type { CognitiveActivation } from '@/core/traits/types';
import {
  TRAIT_DEFINITIONS,
  TRAIT_RELATED_PAIRS,
  normalizeTraitBaseVector,
  type TraitDefinition,
} from '@/core/traits/trait-definitions';
import { applyTraitInteractions } from '@/core/traits/trait-interactions';

/** Full catalog size — activations are not top‑k pruned. */
export const TRAIT_CATALOG_ACTIVATION_COUNT = TRAIT_DEFINITIONS.length;

export { TRAIT_RELATED_PAIRS };

/** Soft floor on raw pole-derived weights (avoids exact zeros before interactions). */
const MIN_RAW_WEIGHT = 0.015;

/**
 * After per-user max normalization: `displayWeight = floor + span * normalized`.
 * Keeps the full catalog visible as a field (low traits stay perceptible).
 */
export const SOFT_DISPLAY_WEIGHT_FLOOR = 0.2;
export const SOFT_DISPLAY_WEIGHT_SPAN = 0.8;

/** Max L∞ magnitude of deterministic noise before scaling by `(1 - weight)`. */
const NOISE_AMPLITUDE = 0.036;

/**
 * How strongly expressed each routing dimension is (0 = neutral 50%, 1 = endpoint).
 * Used so traits do not activate when the participant is uniformly mid-scale.
 */
function extremityFromPercent(percent: number): number {
  const obs = percent / 100;
  return Math.min(1, 2 * Math.abs(obs - 0.5));
}

/**
 * Agreement between observed routing (0–1) and the trait’s expected pole on that dimension.
 * 1 = exact match to expected; 0 = maximally far on the unit line.
 */
function poleProximity(obs01: number, expected: number): number {
  return Math.max(0, 1 - Math.abs(obs01 - expected) * 2);
}

/**
 * Mean over mapping poles: `confidence × extremity × proximity`.
 * Each pole is one explicit questionnaire-derived channel; averaging keeps scales comparable across traits.
 */
function activationWeight(
  def: TraitDefinition,
  rawPercent: Record<string, number>,
  confidence: ConfidenceComponents
): number {
  if (def.mapping.length === 0) return 0;
  let sum = 0;
  for (const pole of def.mapping) {
    const pct = rawPercent[pole.dimension] ?? 50;
    const obs = pct / 100;
    const conf = confidence[pole.dimension].finalConfidence;
    sum += conf * extremityFromPercent(pct) * poleProximity(obs, pole.expected);
  }
  const mean = sum / def.mapping.length;
  return Math.max(0, Math.min(1, mean));
}

/** Blend fixed trait direction with the session (or proxy) row so the constellation coheres to measured embedding. */
const BLEND_TRAIT = 0.52;
const BLEND_SESSION = 0.48;
/** Keeps nearby traits separable after blending toward the session vector. */
const BLEND_ANCHOR_CURVE = 0.1;

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function blendActivationVector(
  baseVector: number[],
  dim: number,
  sessionRow: number[] | null,
  fallbackRow: number[]
): number[] {
  const b = alignVectorToDim(baseVector, dim);
  const row = sessionRow && sessionRow.length > 0 ? sessionRow : fallbackRow;
  return b.map((bj, j) => {
    const sj = row[j] ?? 0.5;
    return clamp01(BLEND_TRAIT * bj + BLEND_SESSION * sj + (bj - 0.5) * BLEND_ANCHOR_CURVE);
  });
}

/** FNV-1a 32-bit — stable across runtimes for the same string. */
function fnv1a32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Session-stable seed: routing scores + optional embedding prefix (same answers + embedding → same field).
 */
export function activationContextSeed(answers: TraitMappingAnswers): number {
  const keys = Object.keys(answers.rawPercent).sort();
  let parts = keys.map((k) => `${k}:${answers.rawPercent[k]}`).join('|');
  if (answers.sessionEmbedding && answers.sessionEmbedding.length > 0) {
    const emb = answers.sessionEmbedding;
    let e = '';
    for (let i = 0; i < Math.min(24, emb.length); i++) {
      e += `,${i}:${Math.round(emb[i]! * 1_000_000)}`;
    }
    parts += `|emb${e}`;
  } else {
    parts += '|emb:none';
  }
  parts += `|dim:${answers.embeddingDimension}`;
  return fnv1a32(parts);
}

/** Deterministic small noise in roughly [-1, 1] per dimension (zero mean). */
function deterministicNoiseVector(dim: number, traitId: string, contextSeed: number): number[] {
  const salt = fnv1a32(traitId) ^ contextSeed;
  const out = new Array(dim);
  for (let j = 0; j < dim; j++) {
    const t = Math.sin((j + 1) * 12.9898 + salt * 0.0000127 + traitId.length * 0.001) * 43758.5453123;
    const u = t - Math.floor(t);
    out[j] = (u - 0.5) * 2;
  }
  return out;
}

export type TraitMappingAnswers = {
  rawPercent: Record<string, number>;
  confidenceComponents: ConfidenceComponents;
  embeddingDimension: number;
  /** Session latent row when available; shapes how strongly traits cohere to measured embedding. */
  sessionEmbedding: number[] | null;
};

/**
 * Maps questionnaire-derived routing signals to weighted micro-traits in ℝ^d.
 * Pipeline: base weights → co-activation rules → full catalog → normalize → per-user vector perturbation
 * (deterministic, noise ∝ `1 − weight`) → soft display mix (floor + span × weight; no power-law sparsity).
 */
export function mapAnswersToActivations(answers: TraitMappingAnswers): CognitiveActivation[] {
  const dim = Math.max(32, answers.embeddingDimension);
  const sessionRow =
    answers.sessionEmbedding && answers.sessionEmbedding.length > 0
      ? alignVectorToDim(answers.sessionEmbedding, dim)
      : null;
  const fallback = liftRawPercentToEmbedding(answers.rawPercent, dim);
  const contextSeed = activationContextSeed(answers);

  const staged: CognitiveActivation[] = TRAIT_DEFINITIONS.map((def) => {
    const w = activationWeight(def, answers.rawPercent, answers.confidenceComponents);
    const vec = blendActivationVector(def.baseVector, dim, sessionRow, fallback);
    return {
      traitId: def.id,
      domain: def.domain,
      vector: vec,
      weight: Math.max(MIN_RAW_WEIGHT, w),
    };
  });

  const interacted = applyTraitInteractions(staged);
  interacted.sort((a, b) => b.weight - a.weight);
  const maxW = Math.max(...interacted.map((t) => t.weight), 1e-6);
  const ranked = interacted.map((t) => ({ ...t, weight: t.weight / maxW }));

  const perturbed = ranked.map((t) => {
    const noise = deterministicNoiseVector(dim, t.traitId, contextSeed);
    const scale = NOISE_AMPLITUDE * (1 - t.weight);
    const raw = t.vector.map((v, j) => v + (noise[j] ?? 0) * scale);
    const clamped = raw.map(clamp01);
    return { ...t, vector: normalizeTraitBaseVector(clamped) };
  });

  const mixed = perturbed.map((t) => ({
    ...t,
    weight: SOFT_DISPLAY_WEIGHT_FLOOR + SOFT_DISPLAY_WEIGHT_SPAN * t.weight,
  }));
  const maxMix = Math.max(...mixed.map((x) => x.weight), 1e-6);
  return mixed.map((t) => ({ ...t, weight: t.weight / maxMix }));
}

export function formatTraitLabel(traitId: string): string {
  return traitId.replace(/_/g, ' ');
}

/** Resolve related pairs to global point indices for traits present in `ids`. */
export function resolveTraitEdges(
  traitIdsInOrder: string[],
  pairs: readonly [string, string][]
): [number, number][] {
  const ix = new Map<string, number>();
  traitIdsInOrder.forEach((id, i) => ix.set(id, i));
  const out: [number, number][] = [];
  for (const [a, b] of pairs) {
    const ia = ix.get(a);
    const ib = ix.get(b);
    if (ia !== undefined && ib !== undefined) out.push([ia, ib]);
  }
  return out;
}

/** Single-linkage clusters in normalized projection space (indices into `points` subset). */
export function clusterActivationProjections(
  globalIndices: number[],
  points: { x: number; y: number }[],
  threshold: number
): number[][] {
  if (globalIndices.length === 0) return [];
  const th2 = threshold * threshold;
  const parent = new Map<number, number>();
  const find = (a: number): number => {
    if (!parent.has(a)) parent.set(a, a);
    let p = parent.get(a)!;
    if (p !== a) {
      p = find(p);
      parent.set(a, p);
    }
    return p;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (let i = 0; i < globalIndices.length; i++) {
    for (let j = i + 1; j < globalIndices.length; j++) {
      const ia = globalIndices[i]!;
      const ib = globalIndices[j]!;
      const pa = points[ia]!;
      const pb = points[ib]!;
      const dx = pa.x - pb.x;
      const dy = pa.y - pb.y;
      if (dx * dx + dy * dy <= th2) union(ia, ib);
    }
  }
  const groups = new Map<number, number[]>();
  for (const idx of globalIndices) {
    const r = find(idx);
    const g = groups.get(r) ?? [];
    g.push(idx);
    groups.set(r, g);
  }
  return [...groups.values()].filter((g) => g.length >= 2);
}
