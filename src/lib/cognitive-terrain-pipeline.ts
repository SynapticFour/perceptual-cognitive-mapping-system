import { UMAP } from 'umap-js';
import type { CognitiveModel, ProjectedPoint2 } from '@/core/cognitive-pipeline';
import {
  computeDensityGrid,
  smoothDensityGrid,
  type CognitiveRegion,
} from '@/core/cognitive-pipeline';
import { activationSpatialDispersion, normalizePlanarCoords } from '@/lib/cognitive-map-projection';
import { TRAIT_DOMAIN_HEX } from '@/core/traits/trait-domains';
import type { TraitDomain } from '@/core/traits/trait-domains';

/** Matches `PLOT_INNER` / density cell in `cognitive-pipeline.ts`. */
const TERRAIN_PLOT = 400 - 28 * 2;
const DENSITY_CELL = 6;
const SMOOTH_RADIUS = 1;
const NORM_PAD = 0.055;

/** Default heightmap grid resolution (PlaneGeometry segments) — exported for 3D terrain. */
export const TERRAIN_DEFAULT_SEGMENTS = 80;

/** Power exponent applied to smoothed density cells to exaggerate peaks vs valleys. */
const TERRAIN_DENSITY_POWER = 0.65;

/** Ridge sharpening above this normalised height (top ~15% before stretch). */
const TERRAIN_RIDGE_THRESHOLD = 0.85;

/** Stretch factor for values above {@link TERRAIN_RIDGE_THRESHOLD} (clamped to 1). */
const TERRAIN_RIDGE_GAIN = 2.2;

export type TerrainEmbedSource = 'umap' | 'pca';

export type TerrainClusterMarker = {
  x: number;
  z: number;
  y: number;
  color: string;
  label: string;
};

export type TerrainDominantPeak = {
  x: number;
  z: number;
  y: number;
  dimensionLabel: string;
  /** Normalised height in [0, 1] after ridge (matches heightmap). */
  strength: number;
};

export type CognitiveTerrainLandscape = {
  source: TerrainEmbedSource;
  segments: number;
  /** Row-major (segments + 1)², values in [0, 1]. */
  heightmap: Float32Array;
  maxDensity: number;
  user: { x: number; z: number; y: number };
  clusters: TerrainClusterMarker[];
  /** Up to three strongest local maxima (ridged heightmap), labelled by nearest region. */
  dominantPeaks: TerrainDominantPeak[];
};

/** Deterministic PRNG for UMAP (reproducible per model fingerprint). */
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashFingerprintToSeed(fp: string): number {
  let h = 2166136261;
  for (let i = 0; i < fp.length; i++) {
    h ^= fp.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Plot (nx, ny) with ny = 0 bottom, ny = 1 top in normalized map space → XZ on [-1, 1]². */
export function plotToSceneXZ(p: ProjectedPoint2): { x: number; z: number } {
  return { x: -1 + 2 * p.x, z: -1 + 2 * (1 - p.y) };
}

function augmentDensityGridWithRegionPeaks(
  grid: number[][],
  cols: number,
  rows: number,
  regions: CognitiveRegion[],
  span: number,
  scale: number
): void {
  if (regions.length < 2) return;
  const sigma = Math.max(0.038, 0.11 * span);
  const sigma2 = 2 * sigma * sigma;
  for (const r of regions) {
    const cx = r.centroid.x;
    const cy = r.centroid.y;
    const amp = scale * (0.26 + 0.38 * r.displayStrength);
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const nx = (gx + 0.5) / cols;
        const ny = 1 - (gy + 0.5) / rows;
        const dx = nx - cx;
        const dy = ny - cy;
        grid[gy][gx] += amp * Math.exp(-(dx * dx + dy * dy) / sigma2);
      }
    }
  }
}

function regionsWithDataCentroids(
  regions: CognitiveRegion[],
  projected: ProjectedPoint2[],
  activationCount: number
): CognitiveRegion[] {
  return regions.map((r) => {
    const idxs = r.pointIndices.filter((i) => i >= 0 && i < activationCount);
    if (idxs.length === 0) return r;
    let sx = 0;
    let sy = 0;
    for (const i of idxs) {
      sx += projected[i]!.x;
      sy += projected[i]!.y;
    }
    const n = idxs.length;
    return { ...r, centroid: { x: sx / n, y: sy / n } };
  });
}

function weightedActivationCentroid(
  projected: ProjectedPoint2[],
  activationCount: number,
  pointWeights: number[]
): ProjectedPoint2 {
  let wx = 0;
  let wy = 0;
  let s = 0;
  for (let i = 0; i < activationCount; i++) {
    const w = pointWeights[i] ?? 0;
    if (w <= 0) continue;
    wx += projected[i]!.x * w;
    wy += projected[i]!.y * w;
    s += w;
  }
  if (s <= 1e-9) return projected[0] ?? { x: 0.5, y: 0.5 };
  return { x: wx / s, y: wy / s };
}

function cloneDensityGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row]);
}

/**
 * After smoothing + augmentation: exaggerate dynamic range (higher → relatively higher).
 * Mutates `grid` in place; returns new max cell value.
 */
function exaggerateDensityGridPowerInPlace(grid: number[][]): number {
  let maxD = 0;
  for (const row of grid) {
    for (let c = 0; c < row.length; c++) {
      const v = Math.max(0, row[c]!);
      const w = Math.pow(v, TERRAIN_DENSITY_POWER);
      row[c] = w;
      maxD = Math.max(maxD, w);
    }
  }
  if (maxD < 1e-9) maxD = 1;
  return maxD;
}

/** Ridge sharpening on normalised heightmap values in [0, 1]. */
function applyRidgeToNormalisedHeightmap(hm: Float32Array): void {
  for (let i = 0; i < hm.length; i++) {
    const h = hm[i]!;
    if (h > TERRAIN_RIDGE_THRESHOLD) {
      hm[i] = Math.min(1, TERRAIN_RIDGE_THRESHOLD + (h - TERRAIN_RIDGE_THRESHOLD) * TERRAIN_RIDGE_GAIN);
    }
  }
}

/** Bilinear sample of histogram grid; ux, uy in [0,1] with uy=0 bottom, uy=1 top. */
export function sampleDensityGridBilinear(
  grid: number[][],
  cols: number,
  rows: number,
  ux: number,
  uy: number
): number {
  if (rows === 0 || cols === 0) return 0;
  const fx = Math.max(0, Math.min(cols - 1 - 1e-9, ux * (cols - 1)));
  const fy = Math.max(0, Math.min(rows - 1 - 1e-9, (1 - uy) * (rows - 1)));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(cols - 1, x0 + 1);
  const y1 = Math.min(rows - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const g = grid;
  const v00 = g[y0]?.[x0] ?? 0;
  const v10 = g[y0]?.[x1] ?? 0;
  const v01 = g[y1]?.[x0] ?? 0;
  const v11 = g[y1]?.[x1] ?? 0;
  const a = v00 * (1 - tx) + v10 * tx;
  const b = v01 * (1 - tx) + v11 * tx;
  return a * (1 - ty) + b * ty;
}

export function densityGridToHeightmap(
  grid: number[][],
  cols: number,
  rows: number,
  maxD: number,
  segments: number,
  out?: Float32Array
): Float32Array {
  const n = segments + 1;
  const size = n * n;
  const hm = out && out.length === size ? out : new Float32Array(size);
  const inv = maxD > 1e-12 ? 1 / maxD : 1;
  let i = 0;
  for (let j = 0; j < n; j++) {
    const uy = j / segments;
    for (let ix = 0; ix < n; ix++) {
      const ux = ix / segments;
      hm[i++] = sampleDensityGridBilinear(grid, cols, rows, ux, uy) * inv;
    }
  }
  return hm;
}

function heightAtPlot(
  heightmap: Float32Array,
  segments: number,
  p: ProjectedPoint2,
  heightScale: number
): number {
  const n = segments + 1;
  const ix = Math.round(p.x * segments);
  const jy = Math.round((1 - p.y) * segments);
  const ii = Math.max(0, Math.min(segments, ix));
  const jj = Math.max(0, Math.min(segments, jy));
  return (heightmap[jj * n + ii] ?? 0) * heightScale;
}

function activationFootprintMask(
  projected: ProjectedPoint2[],
  k: number,
  segments: number
): Set<number> {
  const n = segments + 1;
  const mask = new Set<number>();
  for (let i = 0; i < k; i++) {
    const p = projected[i]!;
    const cx = Math.round(p.x * segments);
    const cy = Math.round((1 - p.y) * segments);
    for (let dj = -2; dj <= 2; dj++) {
      for (let di = -2; di <= 2; di++) {
        const ii = Math.max(0, Math.min(segments, cx + di));
        const jj = Math.max(0, Math.min(segments, cy + dj));
        mask.add(jj * n + ii);
      }
    }
  }
  return mask;
}

function isStrictLocalMaximum(
  hm: Float32Array,
  segments: number,
  ix: number,
  jy: number
): boolean {
  if (ix <= 0 || ix >= segments || jy <= 0 || jy >= segments) return false;
  const n = segments + 1;
  const v = hm[jy * n + ix]!;
  for (let dj = -1; dj <= 1; dj++) {
    for (let di = -1; di <= 1; di++) {
      if (di === 0 && dj === 0) continue;
      const ii = ix + di;
      const jj = jy + dj;
      const nv = hm[jj * n + ii]!;
      if (nv >= v) return false;
    }
  }
  return true;
}

/** Highest strict local maximum inside the activation mask; else argmax in mask; else centroid sample. */
function userPlotOnDominantLocalPeak(
  heightmap: Float32Array,
  segments: number,
  projected: ProjectedPoint2[],
  k: number,
  centroid: ProjectedPoint2
): ProjectedPoint2 {
  const n = segments + 1;
  const mask = activationFootprintMask(projected, k, segments);
  if (mask.size === 0) return centroid;

  let bestLocal: { ix: number; jy: number; h: number } | null = null;
  for (const key of mask) {
    const jy = Math.floor(key / n);
    const ix = key % n;
    if (!isStrictLocalMaximum(heightmap, segments, ix, jy)) continue;
    const h = heightmap[key]!;
    if (!bestLocal || h > bestLocal.h) {
      bestLocal = { ix, jy, h };
    }
  }

  if (bestLocal) {
    return { x: bestLocal.ix / segments, y: 1 - bestLocal.jy / segments };
  }

  let bestIx = Math.round(centroid.x * segments);
  let bestJ = Math.round((1 - centroid.y) * segments);
  let bestH = -1;
  for (const key of mask) {
    const h = heightmap[key]!;
    if (h > bestH) {
      bestH = h;
      const jy = Math.floor(key / n);
      const ix = key % n;
      bestIx = ix;
      bestJ = jy;
    }
  }
  return { x: bestIx / segments, y: 1 - bestJ / segments };
}

function closestRegionLabel(px: number, py: number, regions: CognitiveRegion[]): string {
  if (regions.length === 0) return '—';
  let best = regions[0]!.label;
  let bestD = Infinity;
  for (const r of regions) {
    const dx = r.centroid.x - px;
    const dy = r.centroid.y - py;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = r.label;
    }
  }
  return best;
}

function chebyshev(a: { ix: number; jy: number }, b: { ix: number; jy: number }): number {
  return Math.max(Math.abs(a.ix - b.ix), Math.abs(a.jy - b.jy));
}

/** Up to three separated local maxima on the ridged heightmap. */
function computeDominantPeaks(
  heightmap: Float32Array,
  segments: number,
  regions: CognitiveRegion[],
  heightScale: number
): TerrainDominantPeak[] {
  if (segments < 3) return [];
  const n = segments + 1;
  const locals: { ix: number; jy: number; h: number }[] = [];
  for (let jy = 1; jy < segments; jy++) {
    for (let ix = 1; ix < segments; ix++) {
      if (!isStrictLocalMaximum(heightmap, segments, ix, jy)) continue;
      locals.push({ ix, jy, h: heightmap[jy * n + ix]! });
    }
  }
  locals.sort((a, b) => b.h - a.h);
  const minSep = Math.max(5, Math.floor(segments / 16));
  const picked: { ix: number; jy: number; h: number }[] = [];
  for (const c of locals) {
    if (picked.length >= 3) break;
    if (picked.every((p) => chebyshev(p, c) >= minSep)) {
      picked.push(c);
    }
  }

  const out: TerrainDominantPeak[] = [];
  for (const p of picked) {
    const plot: ProjectedPoint2 = { x: p.ix / segments, y: 1 - p.jy / segments };
    const xz = plotToSceneXZ(plot);
    const h = p.h;
    const ySurf = h * heightScale;
    out.push({
      x: xz.x,
      z: xz.z,
      y: ySurf + 0.04 * heightScale,
      dimensionLabel: closestRegionLabel(plot.x, plot.y, regions),
      strength: h,
    });
  }
  return out;
}

function buildFromDensityAndProjected(
  model: CognitiveModel,
  projected: ProjectedPoint2[],
  source: TerrainEmbedSource,
  segments: number,
  heightScale: number
): CognitiveTerrainLandscape {
  const k = model.activations.length;
  const raw = computeDensityGrid(
    projected,
    TERRAIN_PLOT,
    TERRAIN_PLOT,
    DENSITY_CELL,
    model.pointWeights
  );
  const smooth = smoothDensityGrid(raw.grid, SMOOTH_RADIUS);
  let maxD = 0;
  for (const row of smooth) {
    for (const v of row) maxD = Math.max(maxD, v);
  }
  if (maxD < 1e-9) maxD = 1;
  const disp = activationSpatialDispersion(projected.slice(0, k), k);
  const span = Math.max(disp.spanX, disp.spanY, 0.08);
  const regionsAdj = regionsWithDataCentroids(model.cognitiveRegions, projected, k);
  augmentDensityGridWithRegionPeaks(smooth, raw.cols, raw.rows, regionsAdj, span, maxD);
  maxD = exaggerateDensityGridPowerInPlace(smooth);

  const heightmap = densityGridToHeightmap(smooth, raw.cols, raw.rows, maxD, segments);
  applyRidgeToNormalisedHeightmap(heightmap);

  const centroid = weightedActivationCentroid(projected, k, model.pointWeights);
  const userPlot = userPlotOnDominantLocalPeak(heightmap, segments, projected, k, centroid);
  const userXZ = plotToSceneXZ(userPlot);
  const uy = heightAtPlot(heightmap, segments, userPlot, heightScale);

  const dominantPeaks = computeDominantPeaks(heightmap, segments, regionsAdj, heightScale);

  const clusters: TerrainClusterMarker[] = regionsAdj.map((r) => {
    const xz = plotToSceneXZ(r.centroid);
    const y = heightAtPlot(heightmap, segments, r.centroid, heightScale);
    return {
      x: xz.x,
      z: xz.z,
      y: y + 0.04 * heightScale,
      color: TRAIT_DOMAIN_HEX[r.primaryDomain as TraitDomain],
      label: r.label,
    };
  });

  return {
    source,
    segments,
    heightmap,
    maxDensity: maxD,
    user: { x: userXZ.x, z: userXZ.z, y: uy + 0.06 * heightScale },
    clusters,
    dominantPeaks,
  };
}

function activationProjectedPoints(model: CognitiveModel): ProjectedPoint2[] {
  return model.activationIndices.map((idx) => model.projectedPoints[idx]!);
}

/**
 * Same manifold as Map/Density (joint PCA): instant, uses the precomputed density field.
 */
export function buildTerrainLandscapePcaSync(
  model: CognitiveModel,
  segments = TERRAIN_DEFAULT_SEGMENTS,
  heightScale = 0.38
): CognitiveTerrainLandscape {
  const work = cloneDensityGrid(model.density.grid);
  const maxD = exaggerateDensityGridPowerInPlace(work);
  const heightmap = densityGridToHeightmap(work, model.density.cols, model.density.rows, maxD, segments);
  applyRidgeToNormalisedHeightmap(heightmap);

  const k = model.activations.length;
  const actProj = activationProjectedPoints(model);
  const centroid = model.centroid;
  const userPlot =
    k > 0
      ? userPlotOnDominantLocalPeak(heightmap, segments, actProj, k, centroid)
      : centroid;
  const userXZ = plotToSceneXZ(userPlot);
  const uy = heightAtPlot(heightmap, segments, userPlot, heightScale);

  const regionsAdj = regionsWithDataCentroids(model.cognitiveRegions, actProj, k);
  const dominantPeaks = computeDominantPeaks(heightmap, segments, regionsAdj, heightScale);

  const clusters: TerrainClusterMarker[] = model.cognitiveRegions.map((r) => {
    const xz = plotToSceneXZ(r.centroid);
    const y = heightAtPlot(heightmap, segments, r.centroid, heightScale);
    return {
      x: xz.x,
      z: xz.z,
      y: y + 0.04 * heightScale,
      color: TRAIT_DOMAIN_HEX[r.primaryDomain as TraitDomain],
      label: r.label,
    };
  });

  return {
    source: 'pca',
    segments,
    heightmap,
    maxDensity: maxD,
    user: { x: userXZ.x, z: userXZ.z, y: uy + 0.06 * heightScale },
    clusters,
    dominantPeaks,
  };
}

/**
 * UMAP 2D embedding of trait vectors → KDE grid (same pipeline as the 2D views) → heightmap.
 * Falls back to PCA layout if UMAP fails or the sample is too small.
 */
export async function buildCognitiveTerrainLandscape(
  model: CognitiveModel,
  options?: { segments?: number; heightScale?: number }
): Promise<CognitiveTerrainLandscape> {
  const segments = options?.segments ?? TERRAIN_DEFAULT_SEGMENTS;
  const heightScale = options?.heightScale ?? 0.38;
  const sync = () => buildTerrainLandscapePcaSync(model, segments, heightScale);

  const X = model.allVectors;
  if (X.length < 8 || (X[0]?.length ?? 0) < 2) return sync();

  const n = X.length;
  const nNeighbors = Math.min(15, Math.max(2, n - 1));
  const umap = new UMAP({
    nComponents: 2,
    nNeighbors,
    minDist: 0.14,
    spread: 1,
    nEpochs: Math.min(220, Math.max(100, Math.floor(n * 1.2))),
    random: mulberry32(hashFingerprintToSeed(model.fingerprint)),
  });

  try {
    const embedding = await umap.fitAsync(X);
    const coords = embedding.map(([x, y]) => ({ x, y }));
    const norm = normalizePlanarCoords(coords, NORM_PAD);
    const projected: ProjectedPoint2[] = norm.map((c) => ({ x: c.nx, y: c.ny }));
    return buildFromDensityAndProjected(model, projected, 'umap', segments, heightScale);
  } catch {
    return sync();
  }
}
