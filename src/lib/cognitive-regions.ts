import type { CognitiveActivation } from '@/core/traits/types';
import type { TraitDomain } from '@/core/traits/trait-domains';
import { formatTraitLabel } from '@/core/traits/trait-mapping';

/** Normalized plot coordinates (matches `ProjectedPoint2` in cognitive-pipeline). */
export type RegionPoint2 = { x: number; y: number };

export type CognitiveRegion = {
  id: string;
  /** Local activation indices (0 .. activationCount-1), same as global for activation prefix. */
  pointIndices: number[];
  centroid: RegionPoint2;
  /** Sum of member trait weights (raw). */
  strength: number;
  /** Balanced 0–1 share for visual scaling (no single-region dominance). */
  displayStrength: number;
  /** Derived from top traits in region (not diagnoses / presets). */
  label: string;
  topTraitIds: string[];
  /** Majority trait domain among members (for fill tint). */
  primaryDomain: TraitDomain;
};

export type CognitiveRegionValidation = {
  regionCount: number;
  maxRegionWeightShare: number;
  /** Largest share of activation *count* in one region (Step 9 point-fraction check). */
  maxRegionPointShare: number;
  centroidDistances: number[];
  minCentroidDistance: number;
  separationThreshold: number;
  /** Weight share ≤ 60%. */
  passedDominance: boolean;
  /** Point-count share ≤ 60%. */
  passedPointDominance: boolean;
  passedSeparation: boolean;
  /** False when hull/bbox overlap heuristic says regions are too merged. */
  passedOverlap: boolean;
  heavyOverlap: boolean;
  usedFallback: boolean;
  usedAngleRetry: boolean;
  usedSubdivide: boolean;
  /** All structural checks satisfied (2–5 regions, dominance, separation, overlap). */
  passedAllChecks: boolean;
};

const K_MAX = 5;
const K_MIN = 2;
const MAX_ITER = 48;
/** Normalized plot space: min pairwise centroid distance must exceed this × activation span. */
const SEPARATION_FRAC = 0.07;
/** Dominance: largest region weight share must stay under this for validation pass. */
const DOMINANCE_MAX = 0.6;
/** Hard failure → recovery when weight OR point share exceeds this. */
const DOMINANCE_FAIL = 0.7;
/** Centroid distance vs combined radial extent: below this ratio ⇒ heavy overlap. */
const OVERLAP_EXTENT_RATIO = 0.4;
/** Axis-aligned bbox: intersection / min(area) above this ⇒ heavy overlap. */
const OVERLAP_BBOX_IOU = 0.48;
/** Penalize k in score to prefer 2–4 meaningful regions. */
const K_PENALTY = 0.045;

function meanPoint(pts: RegionPoint2[]): RegionPoint2 {
  if (pts.length === 0) return { x: 0.5, y: 0.5 };
  let sx = 0;
  let sy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / pts.length, y: sy / pts.length };
}

function totalSumSquares(pts: RegionPoint2[]): number {
  if (pts.length <= 1) return 0;
  const m = meanPoint(pts);
  let s = 0;
  for (const p of pts) {
    const dx = p.x - m.x;
    const dy = p.y - m.y;
    s += dx * dx + dy * dy;
  }
  return s;
}

function wcss(pts: RegionPoint2[], assignment: number[], centroids: RegionPoint2[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const c = centroids[assignment[i]!]!;
    const p = pts[i]!;
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    s += dx * dx + dy * dy;
  }
  return s;
}

function pickInitialCentroids(pts: RegionPoint2[], k: number, mode: 'lex' | 'angle'): RegionPoint2[] {
  const n = pts.length;
  const kk = Math.min(k, n);
  const idx = Array.from({ length: n }, (_, i) => i);
  if (mode === 'lex') {
    idx.sort((a, b) => {
      const pa = pts[a]!;
      const pb = pts[b]!;
      if (pa.x !== pb.x) return pa.x - pb.x;
      return pa.y - pb.y;
    });
  } else {
    const c = meanPoint(pts);
    idx.sort((a, b) => {
      const pa = pts[a]!;
      const pb = pts[b]!;
      const ta = Math.atan2(pa.y - c.y, pa.x - c.x);
      const tb = Math.atan2(pb.y - c.y, pb.x - c.x);
      if (ta !== tb) return ta - tb;
      if (pa.x !== pb.x) return pa.x - pb.x;
      return pa.y - pb.y;
    });
  }
  const centroids: RegionPoint2[] = [];
  for (let j = 0; j < kk; j++) {
    const pick = idx[Math.min(n - 1, Math.floor((j + 0.5) * (n / Math.max(kk, 1))))]!;
    centroids.push({ ...pts[pick]! });
  }
  return centroids;
}

function kMeans(
  pts: RegionPoint2[],
  k: number,
  maxIter: number,
  initMode: 'lex' | 'angle' = 'lex'
): { assignment: number[]; centroids: RegionPoint2[] } {
  const n = pts.length;
  if (n === 0) return { assignment: [], centroids: [] };
  const kk = Math.min(k, n);
  const centroids = pickInitialCentroids(pts, k, initMode);

  const assignment = new Array(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let j = 0; j < kk; j++) {
        const dx = pts[i]!.x - centroids[j]!.x;
        const dy = pts[i]!.y - centroids[j]!.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD) {
          bestD = d2;
          best = j;
        }
      }
      if (assignment[i] !== best) {
        assignment[i] = best;
        changed = true;
      }
    }

    const counts = new Array(kk).fill(0);
    const sx = new Array(kk).fill(0);
    const sy = new Array(kk).fill(0);
    for (let i = 0; i < n; i++) {
      const c = assignment[i]!;
      counts[c]++;
      sx[c] += pts[i]!.x;
      sy[c] += pts[i]!.y;
    }

    for (let j = 0; j < kk; j++) {
      if (counts[j] === 0) {
        let farthest = 0;
        let farScore = -1;
        for (let i = 0; i < n; i++) {
          let dMin = Infinity;
          for (let j2 = 0; j2 < kk; j2++) {
            if (j2 === j) continue;
            const dx = pts[i]!.x - centroids[j2]!.x;
            const dy = pts[i]!.y - centroids[j2]!.y;
            dMin = Math.min(dMin, dx * dx + dy * dy);
          }
          if (dMin > farScore) {
            farScore = dMin;
            farthest = i;
          }
        }
        centroids[j] = { ...pts[farthest]! };
      } else {
        centroids[j] = { x: sx[j] / counts[j], y: sy[j] / counts[j] };
      }
    }

    if (!changed) break;
  }

  return { assignment, centroids };
}

function assignmentToGroups(assignment: number[], k: number): number[][] {
  const groups: number[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < assignment.length; i++) {
    groups[assignment[i]!]!.push(i);
  }
  return groups;
}

/** Merge singleton clusters into nearest centroid until all have ≥2 members (or k=2). */
function mergeMicroClusters(
  pts: RegionPoint2[],
  assignment: number[],
  centroids: RegionPoint2[],
  k: number
): { assignment: number[]; centroids: RegionPoint2[]; kActive: number } {
  const a = [...assignment];
  const c = centroids.map((x) => ({ ...x }));
  const kk = k;
  const n = pts.length;
  if (n < 4) return { assignment: a, centroids: c, kActive: kk };

  for (let guard = 0; guard < 16; guard++) {
    const groups = assignmentToGroups(a, kk);
    const small = groups
      .map((g, j) => ({ j, n: g.length }))
      .filter((x) => x.n === 1 && kk > K_MIN);
    if (small.length === 0) break;
    for (const { j } of small) {
      const lone = groups[j]![0]!;
      let best = 0;
      let bestD = Infinity;
      for (let j2 = 0; j2 < kk; j2++) {
        if (j2 === j) continue;
        const dx = pts[lone]!.x - c[j2]!.x;
        const dy = pts[lone]!.y - c[j2]!.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD) {
          bestD = d2;
          best = j2;
        }
      }
      a[lone] = best;
    }
    for (let iter = 0; iter < 8; iter++) {
      const counts = new Array(kk).fill(0);
      const sx = new Array(kk).fill(0);
      const sy = new Array(kk).fill(0);
      for (let i = 0; i < n; i++) {
        const cl = a[i]!;
        counts[cl]++;
        sx[cl] += pts[i]!.x;
        sy[cl] += pts[i]!.y;
      }
      for (let j = 0; j < kk; j++) {
        if (counts[j] > 0) c[j] = { x: sx[j] / counts[j], y: sy[j] / counts[j] };
      }
    }
  }

  const used = new Set(a);
  const map = new Map<number, number>();
  let next = 0;
  for (const v of [...used].sort((x, y) => x - y)) {
    map.set(v, next++);
  }
  const kActive = map.size;
  const a2 = a.map((v) => map.get(v)!);
  const newCentroids: RegionPoint2[] = [];
  for (let j = 0; j < kActive; j++) {
    const mem: RegionPoint2[] = [];
    for (let i = 0; i < n; i++) {
      if (a2[i] === j) mem.push(pts[i]!);
    }
    if (mem.length === 0) continue;
    const sx = mem.reduce((s, p) => s + p.x, 0) / mem.length;
    const sy = mem.reduce((s, p) => s + p.y, 0) / mem.length;
    newCentroids.push({ x: sx, y: sy });
  }
  return { assignment: a2, centroids: newCentroids, kActive: newCentroids.length };
}

function forcedSplitK2(pts: RegionPoint2[], weights: number[]): { assignment: number[]; centroids: RegionPoint2[] } {
  const n = pts.length;
  if (n === 0) return { assignment: [], centroids: [] };
  if (n === 1) return { assignment: [0], centroids: [{ ...pts[0]! }, { ...pts[0]! }] };

  let mx = 0;
  let my = 0;
  let sw = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.max(1e-9, weights[i] ?? 1);
    mx += pts[i]!.x * w;
    my += pts[i]!.y * w;
    sw += w;
  }
  mx /= sw;
  my /= sw;

  let cxx = 0;
  let cyy = 0;
  let cxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = pts[i]!.x - mx;
    const dy = pts[i]!.y - my;
    cxx += dx * dx;
    cyy += dy * dy;
    cxy += dx * dy;
  }
  cxx /= Math.max(1, n);
  cyy /= Math.max(1, n);
  cxy /= Math.max(1, n);

  const trace = cxx + cyy;
  const disc = Math.sqrt(Math.max(0, (trace * trace) / 4 - (cxx * cyy - cxy * cxy)));
  const lam1 = trace / 2 + disc;
  let ux = lam1 - cyy;
  let uy = cxy;
  if (Math.abs(ux) + Math.abs(uy) < 1e-12) {
    ux = 1;
    uy = 0;
  }
  const len = Math.hypot(ux, uy) || 1;
  ux /= len;
  uy /= len;

  const proj = pts.map((p, i) => ({
    i,
    t: (p.x - mx) * ux + (p.y - my) * uy,
  }));
  proj.sort((a, b) => a.t - b.t);
  const assignment = new Array(n).fill(0);
  const mid = Math.floor(n / 2);
  for (let k = mid; k < n; k++) {
    assignment[proj[k]!.i] = 1;
  }

  const c0: RegionPoint2[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
  const cnt = [0, 0];
  for (let i = 0; i < n; i++) {
    const g = assignment[i]!;
    c0[g]!.x += pts[i]!.x;
    c0[g]!.y += pts[i]!.y;
    cnt[g]++;
  }
  const centroids: RegionPoint2[] = [
    cnt[0]! > 0 ? { x: c0[0]!.x / cnt[0]!, y: c0[0]!.y / cnt[0]! } : { x: mx, y: my },
    cnt[1]! > 0 ? { x: c0[1]!.x / cnt[1]!, y: c0[1]!.y / cnt[1]! } : { x: mx, y: my },
  ];
  return { assignment, centroids };
}

function pairwiseCentroidDistances(centroids: RegionPoint2[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < centroids.length; i++) {
    for (let j = i + 1; j < centroids.length; j++) {
      const dx = centroids[i]!.x - centroids[j]!.x;
      const dy = centroids[i]!.y - centroids[j]!.y;
      out.push(Math.sqrt(dx * dx + dy * dy));
    }
  }
  return out;
}

function activationSpan(pts: RegionPoint2[]): number {
  if (pts.length === 0) return 1e-6;
  let minX = pts[0]!.x;
  let maxX = pts[0]!.x;
  let minY = pts[0]!.y;
  let maxY = pts[0]!.y;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return Math.max(1e-6, Math.max(maxX - minX, maxY - minY));
}

function recomputeCentroidsFromAssignment(
  assignment: number[],
  kActive: number,
  pts: RegionPoint2[]
): RegionPoint2[] {
  const groups = assignmentToGroups(assignment, kActive);
  return groups.map((g) => {
    if (g.length === 0) return { x: 0.5, y: 0.5 };
    let sx = 0;
    let sy = 0;
    for (const i of g) {
      sx += pts[i]!.x;
      sy += pts[i]!.y;
    }
    return { x: sx / g.length, y: sy / g.length };
  });
}

function bboxOverlapHeavy(g1: number[], g2: number[], pts: RegionPoint2[]): boolean {
  if (g1.length === 0 || g2.length === 0) return false;
  const box = (g: number[]) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const i of g) {
      const p = pts[i]!;
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const w = maxX - minX;
    const h = maxY - minY;
    return { minX, maxX, minY, maxY, area: Math.max(1e-12, w * h) };
  };
  const a = box(g1);
  const b = box(g2);
  const ix = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
  const iy = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
  const inter = ix * iy;
  const minA = Math.min(a.area, b.area);
  return inter / minA > OVERLAP_BBOX_IOU;
}

function regionsHeavyOverlap(
  groups: number[][],
  centroids: RegionPoint2[],
  pts: RegionPoint2[]
): boolean {
  const k = groups.length;
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const g1 = groups[i]!;
      const g2 = groups[j]!;
      if (g1.length === 0 || g2.length === 0) continue;
      const c1 = centroids[i]!;
      const c2 = centroids[j]!;
      let r1 = 0;
      for (const idx of g1) {
        const p = pts[idx]!;
        r1 = Math.max(r1, Math.hypot(p.x - c1.x, p.y - c1.y));
      }
      let r2 = 0;
      for (const idx of g2) {
        const p = pts[idx]!;
        r2 = Math.max(r2, Math.hypot(p.x - c2.x, p.y - c2.y));
      }
      const d = Math.hypot(c2.x - c1.x, c2.y - c1.y);
      const extent = r1 + r2 + 1e-9;
      if (extent > 1e-6 && d < OVERLAP_EXTENT_RATIO * extent) return true;
      if (bboxOverlapHeavy(g1, g2, pts)) return true;
    }
  }
  return false;
}

type PartitionMetrics = {
  maxWeightShare: number;
  maxPointShare: number;
  minCentroidDist: number;
  separationFail: boolean;
  heavyOverlap: boolean;
  hardFail: boolean;
  softFail: boolean;
  emptyCluster: boolean;
};

function analyzePartition(
  assignment: number[],
  centroids: RegionPoint2[],
  kActive: number,
  pts: RegionPoint2[],
  weights: number[],
  span: number
): PartitionMetrics {
  const n = assignment.length;
  const groups = assignmentToGroups(assignment, kActive);
  const emptyCluster = groups.some((g) => g.length === 0);
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const wShares = groups.map((g) => g.reduce((s, i) => s + (weights[i] ?? 0), 0) / totalW);
  const maxWeightShare = wShares.length ? Math.max(...wShares) : 0;
  const pShares = groups.map((g) => g.length / Math.max(1, n));
  const maxPointShare = pShares.length ? Math.max(...pShares) : 0;
  const dists = pairwiseCentroidDistances(centroids);
  const minCentroidDist = dists.length ? Math.min(...dists) : 0;
  const sepTh = SEPARATION_FRAC * span;
  const separationFail = kActive >= 2 && minCentroidDist < sepTh * 0.85;
  const heavyOverlap = regionsHeavyOverlap(groups, centroids, pts);
  const hardFail =
    maxWeightShare > DOMINANCE_FAIL + 1e-12 ||
    maxPointShare > DOMINANCE_FAIL + 1e-12 ||
    separationFail ||
    heavyOverlap ||
    emptyCluster ||
    kActive < K_MIN;
  const softFail =
    maxWeightShare > DOMINANCE_MAX + 1e-12 ||
    maxPointShare > DOMINANCE_MAX + 1e-12 ||
    separationFail ||
    heavyOverlap;
  return {
    maxWeightShare,
    maxPointShare,
    minCentroidDist: minCentroidDist,
    separationFail,
    heavyOverlap,
    hardFail,
    softFail,
    emptyCluster,
  };
}

/** Negative if `a` is better than `b`. */
function comparePartitionMetrics(a: PartitionMetrics, b: PartitionMetrics): number {
  const aHard = a.hardFail ? 1 : 0;
  const bHard = b.hardFail ? 1 : 0;
  if (aHard !== bHard) return aHard - bHard;
  const aSoft = a.softFail ? 1 : 0;
  const bSoft = b.softFail ? 1 : 0;
  if (aSoft !== bSoft) return aSoft - bSoft;
  const va = Math.max(a.maxWeightShare, a.maxPointShare);
  const vb = Math.max(b.maxWeightShare, b.maxPointShare);
  if (Math.abs(va - vb) > 1e-9) return va - vb;
  if (a.heavyOverlap !== b.heavyOverlap) return (a.heavyOverlap ? 1 : 0) - (b.heavyOverlap ? 1 : 0);
  if (Math.abs(a.minCentroidDist - b.minCentroidDist) > 1e-9) return b.minCentroidDist - a.minCentroidDist;
  return 0;
}

type CandidatePartition = {
  assignment: number[];
  centroids: RegionPoint2[];
  kActive: number;
  tag: string;
};

function subdivideLargestRegionOnce(
  assignment: number[],
  kActive: number,
  pts: RegionPoint2[],
  weights: number[]
): { assignment: number[]; kActive: number } | null {
  const n = assignment.length;
  const groups = assignmentToGroups(assignment, kActive);
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const shares = groups.map((g) => g.reduce((s, i) => s + (weights[i] ?? 0), 0) / totalW);
  let maxI = 0;
  let worst = -1;
  for (let i = 0; i < groups.length; i++) {
    const ws = shares[i]!;
    const ps = groups[i]!.length / Math.max(1, n);
    const sc = Math.max(ws, ps);
    if (sc > worst) {
      worst = sc;
      maxI = i;
    }
  }
  if (worst <= DOMINANCE_MAX + 1e-9) return null;
  if (groups[maxI]!.length < 2) return null;
  if (kActive >= K_MAX) return null;

  const subset = groups[maxI]!;
  const localPts = subset.map((i) => pts[i]!);
  const { assignment: la } = kMeans(localPts, 2, MAX_ITER, 'lex');
  const newA = assignment.slice();
  const newId = kActive;
  for (let li = 0; li < subset.length; li++) {
    const gi = subset[li]!;
    if (la[li] === 1) newA[gi] = newId;
    else newA[gi] = maxI;
  }
  const c0 = la.filter((x) => x === 0).length;
  const c1 = la.filter((x) => x === 1).length;
  if (c0 === 0 || c1 === 0) return null;

  const used = new Set(newA);
  const map = new Map<number, number>();
  let next = 0;
  for (const v of [...used].sort((x, y) => x - y)) {
    map.set(v, next++);
  }
  const remapped = newA.map((v) => map.get(v)!);
  return { assignment: remapped, kActive: map.size };
}

function balanceDisplayStrengths(rawShares: number[]): number[] {
  const n = rawShares.length;
  if (n === 0) return [];
  let adjusted = rawShares.map((s) => Math.pow(Math.max(1e-9, s), 0.82));
  let sum = adjusted.reduce((a, b) => a + b, 0);
  adjusted = adjusted.map((x) => x / sum);
  const cap = 0.52;
  for (let pass = 0; pass < 6; pass++) {
    const over = adjusted.some((x) => x > cap + 1e-9);
    if (!over) break;
    adjusted = adjusted.map((x) => Math.min(x, cap));
    sum = adjusted.reduce((a, b) => a + b, 0);
    adjusted = adjusted.map((x) => x / sum);
  }
  return adjusted;
}

function majorityDomain(indices: number[], activations: CognitiveActivation[]): TraitDomain {
  const counts = new Map<TraitDomain, number>();
  for (const i of indices) {
    const d = activations[i]!.domain;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  let best: TraitDomain = activations[indices[0]!]!.domain;
  let bestN = 0;
  for (const [d, n] of counts) {
    if (n > bestN) {
      bestN = n;
      best = d;
    }
  }
  return best;
}

function buildLabel(topTraitIds: string[]): string {
  const parts = topTraitIds.slice(0, 3).map((id) => formatTraitLabel(id));
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} + ${parts[1]}`;
  return `${parts[0]} + ${parts[1]} + ${parts[2]}`;
}

/** Monotone chain convex hull; returns vertices in CCW order. */
export function convexHull2d(points: RegionPoint2[]): RegionPoint2[] {
  if (points.length <= 2) return points.map((p) => ({ ...p }));
  const pts = [...points].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));
  const cross = (o: RegionPoint2, a: RegionPoint2, b: RegionPoint2) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: RegionPoint2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: RegionPoint2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/** Expand hull outward from its centroid by `scale` (e.g. 1.1). */
export function expandHull(hull: RegionPoint2[], scale: number): RegionPoint2[] {
  if (hull.length === 0) return hull;
  let cx = 0;
  let cy = 0;
  for (const p of hull) {
    cx += p.x;
    cy += p.y;
  }
  cx /= hull.length;
  cy /= hull.length;
  const s = Math.max(1.0, scale);
  return hull.map((p) => ({
    x: cx + (p.x - cx) * s,
    y: cy + (p.y - cy) * s,
  }));
}

/** Soft region boundary in normalized plot space (blob around member activations). */
export function regionBoundaryPoints(
  memberPoints: RegionPoint2[],
  displayStrength: number
): RegionPoint2[] {
  if (memberPoints.length === 0) return [];
  const pad = 0.016 * (0.85 + displayStrength);
  if (memberPoints.length === 1) {
    const p = memberPoints[0]!;
    return [
      { x: p.x - pad, y: p.y - pad },
      { x: p.x + pad, y: p.y - pad },
      { x: p.x + pad, y: p.y + pad },
      { x: p.x - pad, y: p.y + pad },
    ];
  }
  if (memberPoints.length === 2) {
    const a = memberPoints[0]!;
    const b = memberPoints[1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1e-6;
    const px = (-dy / len) * pad * 1.2;
    const py = (dx / len) * pad * 1.2;
    return [
      { x: a.x + px, y: a.y + py },
      { x: b.x + px, y: b.y + py },
      { x: b.x - px, y: b.y - py },
      { x: a.x - px, y: a.y - py },
    ];
  }
  const hull = convexHull2d(memberPoints);
  return expandHull(hull, 1.08 + 0.07 * displayStrength);
}

export function buildRegionValidation(
  regions: CognitiveRegion[],
  pts: RegionPoint2[],
  span: number,
  meta: { usedFallback: boolean; usedAngleRetry: boolean; usedSubdivide: boolean }
): CognitiveRegionValidation {
  const n = pts.length;
  if (regions.length === 0) {
    return {
      regionCount: 0,
      maxRegionWeightShare: 1,
      maxRegionPointShare: 1,
      centroidDistances: [],
      minCentroidDistance: 0,
      separationThreshold: SEPARATION_FRAC * span,
      passedDominance: false,
      passedPointDominance: false,
      passedSeparation: false,
      passedOverlap: false,
      heavyOverlap: true,
      usedFallback: meta.usedFallback,
      usedAngleRetry: meta.usedAngleRetry,
      usedSubdivide: meta.usedSubdivide,
      passedAllChecks: false,
    };
  }
  const groups = regions.map((r) => r.pointIndices);
  const centroids = regions.map((r) => r.centroid);
  const totalW = regions.reduce((s, r) => s + r.strength, 0) || 1;
  const maxRegionWeightShare = Math.max(...regions.map((r) => r.strength / totalW));
  const maxRegionPointShare = Math.max(...regions.map((r) => r.pointIndices.length / Math.max(1, n)));
  const centroidDistances = pairwiseCentroidDistances(centroids);
  const minCentroidDistance = centroidDistances.length ? Math.min(...centroidDistances) : 0;
  const separationThreshold = SEPARATION_FRAC * span;
  const heavyOverlap = regionsHeavyOverlap(groups, centroids, pts);
  const passedSeparation =
    regions.length < 2 || minCentroidDistance >= separationThreshold - 1e-9;
  const passedDominance = maxRegionWeightShare <= DOMINANCE_MAX + 1e-9;
  const passedPointDominance = maxRegionPointShare <= DOMINANCE_MAX + 1e-9;
  const passedOverlap = !heavyOverlap;
  const passedAllChecks =
    regions.length >= K_MIN &&
    regions.length <= K_MAX &&
    passedDominance &&
    passedPointDominance &&
    passedSeparation &&
    passedOverlap;
  return {
    regionCount: regions.length,
    maxRegionWeightShare,
    maxRegionPointShare,
    centroidDistances,
    minCentroidDistance,
    separationThreshold,
    passedDominance,
    passedPointDominance,
    passedSeparation,
    passedOverlap,
    heavyOverlap,
    usedFallback: meta.usedFallback,
    usedAngleRetry: meta.usedAngleRetry,
    usedSubdivide: meta.usedSubdivide,
    passedAllChecks,
  };
}

export function computeCognitiveRegions(
  activations: CognitiveActivation[],
  projectedPoints: RegionPoint2[]
): {
  regions: CognitiveRegion[];
  validation: CognitiveRegionValidation;
} {
  const n = activations.length;
  const pts = projectedPoints.slice(0, n);
  const weights = activations.map((a) => a.weight);

  const emptyValidation: CognitiveRegionValidation = {
    regionCount: 0,
    maxRegionWeightShare: 1,
    maxRegionPointShare: 1,
    centroidDistances: [],
    minCentroidDistance: 0,
    separationThreshold: 0,
    passedDominance: false,
    passedPointDominance: false,
    passedSeparation: false,
    passedOverlap: false,
    heavyOverlap: true,
    usedFallback: false,
    usedAngleRetry: false,
    usedSubdivide: false,
    passedAllChecks: false,
  };

  if (n < 2) {
    return {
      regions: [],
      validation: { ...emptyValidation, regionCount: n === 1 ? 1 : 0 },
    };
  }

  const span = activationSpan(pts);
  const tssVal = totalSumSquares(pts);
  const tssSafe = Math.max(tssVal, 1e-12);

  const kUpper = Math.min(K_MAX, n);
  const candidates: CandidatePartition[] = [];

  for (let k = K_MIN; k <= kUpper; k++) {
    const { assignment, centroids } = kMeans(pts, k, MAX_ITER, 'lex');
    const merged = mergeMicroClusters(pts, assignment, centroids, k);
    candidates.push({
      assignment: merged.assignment,
      centroids: merged.centroids,
      kActive: merged.kActive,
      tag: `lex-${k}`,
    });
  }

  for (let k = K_MIN; k <= kUpper; k++) {
    const { assignment, centroids } = kMeans(pts, k, MAX_ITER, 'angle');
    const merged = mergeMicroClusters(pts, assignment, centroids, k);
    candidates.push({
      assignment: merged.assignment,
      centroids: merged.centroids,
      kActive: merged.kActive,
      tag: `angle-${k}`,
    });
  }

  const primaryLex = candidates.filter((c) => c.tag.startsWith('lex-'));
  let bestScore = Infinity;
  let primaryBest: CandidatePartition | null = null;
  for (const c of primaryLex) {
    const wc = wcss(pts, c.assignment, c.centroids);
    const ratio = wc / tssSafe;
    const score = ratio + K_PENALTY * (c.kActive - 2);
    if (score < bestScore) {
      bestScore = score;
      primaryBest = c;
    }
  }
  if (primaryBest) {
    candidates.push({ ...primaryBest, tag: 'lex-wcss-best' });
  }

  const fb = forcedSplitK2(pts, weights);
  candidates.push({
    assignment: fb.assignment,
    centroids: fb.centroids,
    kActive: 2,
    tag: 'forced',
  });

  let best: CandidatePartition | null = null;
  let bestM: PartitionMetrics | null = null;
  for (const c of candidates) {
    const m = analyzePartition(c.assignment, c.centroids, c.kActive, pts, weights, span);
    if (m.emptyCluster) continue;
    if (!bestM || comparePartitionMetrics(m, bestM) < 0) {
      bestM = m;
      best = c;
    }
  }

  if (!best || !bestM) {
    const f2 = forcedSplitK2(pts, weights);
    best = {
      assignment: f2.assignment,
      centroids: f2.centroids,
      kActive: 2,
      tag: 'forced-empty',
    };
    bestM = analyzePartition(best.assignment, best.centroids, best.kActive, pts, weights, span);
  }

  let assignment = best.assignment;
  let centroids = best.centroids;
  let kActive = best.kActive;
  const winningTag = best.tag;
  let usedFallback = winningTag.startsWith('forced');
  let usedAngleRetry = winningTag.startsWith('angle');
  let usedSubdivide = false;

  if (bestM.hardFail) {
    const f2 = forcedSplitK2(pts, weights);
    assignment = f2.assignment;
    centroids = f2.centroids;
    kActive = 2;
    usedFallback = true;
    usedAngleRetry = false;
  }

  let guard = 0;
  while (guard++ < 8 && kActive < K_MAX) {
    const m = analyzePartition(assignment, centroids, kActive, pts, weights, span);
    if (!m.softFail && !m.hardFail) break;
    if (
      m.maxWeightShare <= DOMINANCE_MAX + 1e-9 &&
      m.maxPointShare <= DOMINANCE_MAX + 1e-9 &&
      !m.heavyOverlap &&
      !m.separationFail
    ) {
      break;
    }
    const sub = subdivideLargestRegionOnce(assignment, kActive, pts, weights);
    if (!sub) break;
    assignment = sub.assignment;
    kActive = sub.kActive;
    centroids = recomputeCentroidsFromAssignment(assignment, kActive, pts);
    usedSubdivide = true;
  }

  let finalM = analyzePartition(assignment, centroids, kActive, pts, weights, span);
  if (finalM.hardFail) {
    const f2 = forcedSplitK2(pts, weights);
    assignment = f2.assignment;
    centroids = f2.centroids;
    kActive = 2;
    usedFallback = true;
    finalM = analyzePartition(assignment, centroids, kActive, pts, weights, span);
  }

  const groups = assignmentToGroups(assignment, kActive);
  const regionsRaw: { indices: number[]; centroid: RegionPoint2; strength: number }[] = [];
  for (const g of groups) {
    if (g.length === 0) continue;
    const memPts = g.map((i) => pts[i]!);
    const str = g.reduce((s, i) => s + (weights[i] ?? 0), 0);
    const wc =
      g.length === 1
        ? { ...memPts[0]! }
        : {
            x: memPts.reduce((s, p) => s + p.x, 0) / memPts.length,
            y: memPts.reduce((s, p) => s + p.y, 0) / memPts.length,
          };
    regionsRaw.push({ indices: [...g].sort((a, b) => a - b), centroid: wc, strength: str });
  }

  const totalStr = regionsRaw.reduce((s, r) => s + r.strength, 0) || 1;
  const rawShares = regionsRaw.map((r) => r.strength / totalStr);
  const display = balanceDisplayStrengths(rawShares);

  const regions: CognitiveRegion[] = regionsRaw.map((raw, i) => {
    const traitScores = raw.indices.map((li) => ({
      id: activations[li]!.traitId,
      w: weights[li] ?? 0,
    }));
    traitScores.sort((a, b) => b.w - a.w);
    const topTraitIds = traitScores.slice(0, 3).map((t) => t.id);
    return {
      id: `r${i}`,
      pointIndices: raw.indices,
      centroid: raw.centroid,
      strength: raw.strength,
      displayStrength: display[i] ?? raw.strength / totalStr,
      label: buildLabel(topTraitIds),
      topTraitIds,
      primaryDomain: majorityDomain(raw.indices, activations),
    };
  });

  const validation = buildRegionValidation(regions, pts, span, {
    usedFallback,
    usedAngleRetry,
    usedSubdivide,
  });

  return { regions, validation };
}
