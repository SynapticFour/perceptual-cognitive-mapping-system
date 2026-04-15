import type { CognitiveVector } from '@/model/cognitive-dimensions';
import { COGNITIVE_DIMENSION_KEYS } from '@/model/cognitive-dimensions';

/** Pad or truncate so every row has the same width (deterministic). */
export function alignVectorToDim(v: number[], dim: number): number[] {
  if (dim <= 0) return [];
  if (v.length === 0) return new Array(dim).fill(0);
  if (v.length === dim) return v.slice();
  if (v.length > dim) return v.slice(0, dim);
  const out = v.slice();
  const base = Math.max(v.length, 1);
  for (let i = v.length; i < dim; i++) {
    const src = out[i % base];
    out.push(src * (0.92 + 0.06 * Math.sin((i + 1) * 0.73)));
  }
  return out;
}

/**
 * Deterministic projection of a unit-interval routing profile into ℝ^dim.
 *
 * This is a PILOT PROJECTION, not a trained ML embedding. It uses a fixed
 * trigonometric expansion to create a higher-dimensional representation
 * suitable for cosine-similarity comparisons between profiles.
 *
 * Once empirical data is available, replace this with PCA-derived loadings
 * computed from real session data (see src/lib/pca.ts).
 *
 * @param cog - Routing scores (F–V), each in [0, 1]
 * @param dim - Target dimensionality (canonical: 32)
 * @returns L2-normalizable projection vector in ℝ^dim
 */
export function projectCognitiveVectorToLatentSpace(cog: CognitiveVector, dim: number): number[] {
  const keys = COGNITIVE_DIMENSION_KEYS;
  const out = new Array(dim);
  for (let j = 0; j < dim; j++) {
    const k = keys[j % keys.length];
    const base = cog[k];
    const phase = Math.sin((j + 1) * 0.37) * 0.06;
    out[j] = Math.max(0, Math.min(1, base + phase));
  }
  return out;
}

/** @deprecated Use projectCognitiveVectorToLatentSpace */
export const liftCognitiveVectorToEmbedding = projectCognitiveVectorToLatentSpace;

/** When no latent vector is available (e.g. URL share), build a smooth proxy from raw percents. */
export function liftRawPercentToEmbedding(rawPercent: Record<string, number>, dim: number): number[] {
  const keys = COGNITIVE_DIMENSION_KEYS;
  const out = new Array(dim);
  for (let j = 0; j < dim; j++) {
    const k = keys[j % keys.length];
    const base = (rawPercent[k] ?? 50) / 100;
    const phase = Math.sin((j + 1) * 0.21) * 0.04;
    out[j] = Math.max(0, Math.min(1, base + phase));
  }
  return out;
}

function matSymVec(C: number[][], v: number[]): number[] {
  const d = v.length;
  const out = new Array(d).fill(0);
  for (let i = 0; i < d; i++) {
    let s = 0;
    for (let j = 0; j < d; j++) s += C[i][j] * v[j];
    out[i] = s;
  }
  return out;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

function deflate(C: number[][], v: number[], lambda: number): void {
  const d = v.length;
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      C[i][j] -= lambda * v[i] * v[j];
    }
  }
}

function covariance(points: number[][]): { mean: number[]; C: number[][] } {
  const k = points.length;
  const d = points[0]?.length ?? 0;
  const mean = new Array(d).fill(0);
  for (const p of points) {
    for (let j = 0; j < d; j++) mean[j] += p[j];
  }
  for (let j = 0; j < d; j++) mean[j] /= k;
  const C: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
  const denom = Math.max(1, k - 1);
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      let s = 0;
      for (let r = 0; r < k; r++) {
        s += (points[r][i] - mean[i]) * (points[r][j] - mean[j]);
      }
      C[i][j] = s / denom;
    }
  }
  return { mean, C };
}

function powerEigenvector(C: number[][], seed: number): number[] {
  const d = C.length;
  if (d === 0) return [];
  let v = new Array(d);
  let x = seed || 1;
  for (let i = 0; i < d; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    v[i] = (x / 0x7fffffff) * 2 - 1;
  }
  const n = norm(v);
  if (n < 1e-12) {
    v = new Array(d).fill(0);
    v[0] = 1;
  } else {
    v = v.map((t) => t / n);
  }
  for (let iter = 0; iter < 96; iter++) {
    const w = matSymVec(C, v);
    const nw = norm(w);
    if (nw < 1e-14) break;
    v = w.map((t) => t / nw);
  }
  return v;
}

/** Mean-centered PCA into two axes (session + reference points share the same basis). */
export function projectPointsTo2dPca(points: number[][]): { x: number; y: number }[] {
  const k = points.length;
  const d = points[0]?.length ?? 0;
  if (k === 0 || d === 0) return [];
  if (k === 1) {
    return [{ x: 0, y: 0 }];
  }
  const { mean, C } = covariance(points);
  const C1 = C.map((row) => [...row]);
  const pc1 = powerEigenvector(C1, 42);
  const lambda1 = dot(pc1, matSymVec(C, pc1));
  deflate(C1, pc1, lambda1);
  const pc2 = powerEigenvector(C1, 17);

  return points.map((p) => {
    const z = p.map((v, j) => v - mean[j]);
    return { x: dot(z, pc1), y: dot(z, pc2) };
  });
}

export type NormalizedCoord = { nx: number; ny: number };

function hash32Str(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic micro-jitter (plot space 0–1) for organic field rendering. */
export function activationPositionJitter(seed: string, index: number): { jx: number; jy: number } {
  const h = hash32Str(`${seed}\0${index}`);
  const h2 = Math.imul(h ^ 0xdeadbeef, 2246822519) >>> 0;
  const mag = 0.013;
  const jx = ((h & 0xffff) / 0xffff - 0.5) * 2 * mag;
  const jy = ((h2 & 0xffff) / 0xffff - 0.5) * 2 * mag;
  return { jx, jy };
}

/**
 * After PCA normalization: spread activations so the field does not read as a single blob.
 * Repels from the weighted centroid, optionally expands a tight bbox, then applies jitter.
 */
export function spreadActivationProjections(
  points: { x: number; y: number }[],
  activationCount: number,
  weights: number[],
  jitterSeeds: string[]
): void {
  const margin = 0.035;
  if (activationCount <= 0) return;

  let cx = 0;
  let cy = 0;
  let sw = 0;
  for (let i = 0; i < activationCount; i++) {
    const w = Math.max(1e-9, weights[i] ?? 1);
    cx += points[i]!.x * w;
    cy += points[i]!.y * w;
    sw += w;
  }
  cx /= sw;
  cy /= sw;

  const repel = 0.048;
  for (let i = 0; i < activationCount; i++) {
    const p = points[i]!;
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    p.x += (dx / len) * repel;
    p.y += (dy / len) * repel;
  }

  const localStrength = 0.019;
  const kNeighbors = Math.min(6, Math.max(2, activationCount - 1));
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < activationCount; i++) {
      const p = points[i]!;
      const dists: { j: number; d2: number }[] = [];
      for (let j = 0; j < activationCount; j++) {
        if (i === j) continue;
        const q = points[j]!;
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        dists.push({ j, d2: dx * dx + dy * dy });
      }
      dists.sort((a, b) => a.d2 - b.d2);
      const take = Math.min(kNeighbors, dists.length);
      if (take === 0) continue;
      let lcx = 0;
      let lcy = 0;
      for (let t = 0; t < take; t++) {
        const q = points[dists[t]!.j]!;
        lcx += q.x;
        lcy += q.y;
      }
      lcx /= take;
      lcy /= take;
      const ldx = p.x - lcx;
      const ldy = p.y - lcy;
      const llen = Math.hypot(ldx, ldy) || 1;
      p.x += (ldx / llen) * localStrength;
      p.y += (ldy / llen) * localStrength;
    }
  }

  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (let i = 0; i < activationCount; i++) {
    const p = points[i]!;
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const span = Math.max(spanX, spanY, 1e-9);
  const targetSpan = 0.58;
  if (activationCount >= 2 && span < targetSpan) {
    const scale = targetSpan / span;
    const mx = (minX + maxX) / 2;
    const my = (minY + maxY) / 2;
    for (let i = 0; i < activationCount; i++) {
      const p = points[i]!;
      p.x = mx + (p.x - mx) * scale;
      p.y = my + (p.y - my) * scale;
    }
  }

  for (let i = 0; i < activationCount; i++) {
    const p = points[i]!;
    const { jx, jy } = activationPositionJitter(jitterSeeds[i] ?? `${i}`, i);
    p.x += jx;
    p.y += jy;
    p.x = Math.min(1 - margin, Math.max(margin, p.x));
    p.y = Math.min(1 - margin, Math.max(margin, p.y));
  }
}

/** Quantitative spread of activation projections (0–1 plot space). For tests / debug invariants. */
export function activationSpatialDispersion(points: { x: number; y: number }[], activationCount: number): {
  spanX: number;
  spanY: number;
  varianceX: number;
  varianceY: number;
} {
  if (activationCount <= 0) {
    return { spanX: 0, spanY: 0, varianceX: 0, varianceY: 0 };
  }
  const xs = points.slice(0, activationCount).map((p) => p.x);
  const ys = points.slice(0, activationCount).map((p) => p.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const mx = xs.reduce((s, v) => s + v, 0) / activationCount;
  const my = ys.reduce((s, v) => s + v, 0) / activationCount;
  const varianceX = xs.reduce((s, v) => s + (v - mx) ** 2, 0) / activationCount;
  const varianceY = ys.reduce((s, v) => s + (v - my) ** 2, 0) / activationCount;
  return { spanX, spanY, varianceX, varianceY };
}

/** Map PCA coords into [0,1]² with margin for drawing. */
export function normalizePlanarCoords(
  coords: { x: number; y: number }[],
  pad = 0.1
): NormalizedCoord[] {
  if (coords.length === 0) return [];
  let minX = coords[0].x;
  let maxX = coords[0].x;
  let minY = coords[0].y;
  let maxY = coords[0].y;
  for (const c of coords) {
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
    minY = Math.min(minY, c.y);
    maxY = Math.max(maxY, c.y);
  }
  const spanX = Math.max(maxX - minX, 1e-9);
  const spanY = Math.max(maxY - minY, 1e-9);
  const mx = (minX + maxX) / 2;
  const my = (minY + maxY) / 2;
  const rx = (spanX / 2) * (1 + pad * 2);
  const ry = (spanY / 2) * (1 + pad * 2);
  return coords.map((c) => ({
    nx: 0.5 + (c.x - mx) / (2 * rx),
    ny: 0.5 + (c.y - my) / (2 * ry),
  }));
}
