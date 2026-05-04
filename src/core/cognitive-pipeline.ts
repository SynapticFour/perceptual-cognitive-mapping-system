import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { COGNITIVE_ARCHETYPES } from '@/data/archetypes';
import { createRng, generateSyntheticPopulation } from '@/core/synthetic-population';
import { mapAnswersToActivations, resolveTraitEdges, TRAIT_RELATED_PAIRS } from '@/core/traits/trait-mapping';
import {
  alignVectorToDim,
  projectCognitiveVectorToLatentSpace,
  liftRawPercentToEmbedding,
  normalizePlanarCoords,
  projectPointsTo2dPca,
  activationSpatialDispersion,
  spreadActivationProjections,
} from '@/lib/cognitive-map-projection';
import {
  computeCognitiveRegions,
  type CognitiveRegion,
  type CognitiveRegionValidation,
} from '@/lib/cognitive-regions';

export type { CognitiveRegion, CognitiveRegionValidation } from '@/lib/cognitive-regions';
export { buildRegionValidation } from '@/lib/cognitive-regions';
import { isPcmsDebugField } from '@/lib/pcms-debug';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import { DEFAULT_COGNITIVE_VECTOR, type CognitiveDimension, type CognitiveVector } from '@/model/cognitive-dimensions';
import type { TraitDomain } from '@/core/traits/trait-domains';
import type { CognitiveActivation } from '@/core/traits/types';
import type { ConfidenceComponents } from '@/scoring';
/** Must match `VIEW_INNER` in `ui/views/map-layout.ts` (density bins align with plot). */
const PLOT_INNER = 400 - 28 * 2;

export type CognitivePointKind = 'activation' | 'archetype' | 'extra' | 'synthetic';

export type CognitiveExtraPoint = {
  id: string;
  label: string;
  vector: number[];
};

/** @deprecated Use CognitiveExtraPoint — kept for existing prop names. */
export type CognitiveMapExtraPoint = CognitiveExtraPoint;

const SYNTHETIC_COUNT_DEFAULT = 300;
const SYNTHETIC_NOISE = 0.1;
const DENSITY_CELL = 6;

/** Deterministic archetype rows per embedding width — avoids recomputing on every results render. */
const ARCHETYPE_LATENT_ROWS_CACHE = new Map<number, number[][]>();

function getArchetypeLatentRows(dim: number): number[][] {
  let rows = ARCHETYPE_LATENT_ROWS_CACHE.get(dim);
  if (!rows) {
    rows = COGNITIVE_ARCHETYPES.map((a) => projectCognitiveVectorToLatentSpace(a.vector, dim));
    ARCHETYPE_LATENT_ROWS_CACHE.set(dim, rows);
  }
  return rows;
}
/** Lower radius preserves multiple density peaks (avoids one merged mountain). */
const SMOOTH_RADIUS = 1;

export type ProjectedPoint2 = { x: number; y: number };

/** Histogram density on normalized plot coordinates → width × height bins. */
export function computeDensityGrid(
  points: ProjectedPoint2[],
  width: number,
  height: number,
  cellSize: number,
  pointWeights?: number[]
): { grid: number[][]; cols: number; rows: number } {
  const cols = Math.max(1, Math.floor(width / cellSize));
  const rows = Math.max(1, Math.floor(height / cellSize));
  const grid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let ip = 0; ip < points.length; ip++) {
    const p = points[ip]!;
    const rawW = pointWeights?.[ip] ?? 1;
    const inc = Math.sqrt(Math.max(0, rawW));
    const nx = Math.max(0, Math.min(1 - 1e-9, p.x));
    const ny = Math.max(0, Math.min(1 - 1e-9, p.y));
    const px = nx * width;
    const py = (1 - ny) * height;
    const cx = Math.min(cols - 1, Math.floor(px / cellSize));
    const cy = Math.min(rows - 1, Math.floor(py / cellSize));
    grid[cy][cx] += inc;
  }
  return { grid, cols, rows };
}

/** Add localized peaks at each cognitive region centroid so density reads as multi-modal, not one global maximum. */
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

export function smoothDensityGrid(grid: number[][], radius: number): number[][] {
  if (grid.length === 0 || !grid[0]?.length) return grid;
  const rows = grid.length;
  const cols = grid[0].length;
  const r = Math.max(0, Math.min(6, Math.floor(radius)));
  let cur = grid.map((row) => [...row]);
  for (let pass = 0; pass < 2; pass++) {
    const next = cur.map((row) => [...row]);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let s = 0;
        let c = 0;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dx) + Math.abs(dy) > r) continue;
            const yy = y + dy;
            const xx = x + dx;
            if (yy >= 0 && yy < rows && xx >= 0 && xx < cols) {
              s += cur[yy][xx];
              c += 1;
            }
          }
        }
        next[y][x] = c > 0 ? s / c : 0;
      }
    }
    cur = next;
  }
  return cur;
}

function seedFromRows(user: number[], dim: number, extraCount: number): number {
  let h = 2166136261;
  for (let i = 0; i < Math.min(user.length, 48); i++) {
    h ^= Math.floor(user[i] * 1_000_000 + i * 17);
    h = Math.imul(h, 16777619);
  }
  h ^= dim * 0x9e3779b9;
  h ^= extraCount * 0x85ebca6b;
  return h >>> 0;
}

export interface BuildCognitiveModelInput {
  embeddingVector: number[] | null;
  embeddingDimension: number;
  display: DimensionDisplayModel;
  confidenceComponents: ConfidenceComponents;
  extraPoints?: CognitiveExtraPoint[];
  syntheticCount?: number;
}

/** Derived hotspot label input (majority domain among member activations). */
export type ActivationClusterHint = {
  memberIndices: number[];
  domain: TraitDomain;
  traitCount: number;
};

function buildClusterVisualBoost(pointCount: number, clusters: number[][]): number[] {
  const boost = new Array(pointCount).fill(1);
  if (clusters.length === 0) return boost;
  let maxSz = 2;
  for (const g of clusters) maxSz = Math.max(maxSz, g.length);
  for (const g of clusters) {
    const span = Math.max(1, maxSz - 1);
    const b = 1 + 0.24 * ((g.length - 1) / span);
    for (const idx of g) {
      if (idx >= 0 && idx < pointCount) boost[idx] = Math.max(boost[idx]!, b);
    }
  }
  return boost;
}

function buildActivationClusterHints(
  clusters: number[][],
  activationDomains: TraitDomain[],
  minMembers: number
): ActivationClusterHint[] {
  const hints: ActivationClusterHint[] = [];
  for (const g of clusters) {
    if (g.length < minMembers) continue;
    const counts = new Map<TraitDomain, number>();
    for (const idx of g) {
      const d = activationDomains[idx]!;
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    let best: TraitDomain = activationDomains[g[0]!]!;
    let bestN = 0;
    for (const [d, n] of counts) {
      if (n > bestN) {
        bestN = n;
        best = d;
      }
    }
    hints.push({ memberIndices: [...g], domain: best, traitCount: g.length });
  }
  return hints;
}

export interface CognitiveModel {
  /** Weighted blend of activation vectors (same width as rows in `allVectors`). */
  embedding: number[];
  /** Normalized plot coordinates (0–1 domain after shared PCA + fit). */
  projectedPoints: ProjectedPoint2[];
  /** Full stack: activations, archetypes, extras, synthetic — same order as projectedPoints. */
  allVectors: number[][];
  kinds: CognitivePointKind[];
  labels: string[];
  /** Weights for density + point size (0 for non-activations). */
  pointWeights: number[];
  /** Cluster-size hint for labels only; not applied to weights or density (no visual dominance). */
  clusterVisualBoost: number[];
  /** Optional derived labels for larger activation clusters (majority domain). */
  activationClusterHints: ActivationClusterHint[];
  /** Weighted centroid of activation projections (normalized plot space). */
  centroid: ProjectedPoint2;
  /** Global indices into `projectedPoints` for each activation (prefix of the list). */
  activationIndices: number[];
  /** Same order as activation rows / prefix of `projectedPoints` (index i = activation i). */
  activationDomains: TraitDomain[];
  /** Multi-center cognition: 2–5 regions (local activation indices per group). */
  cognitiveRegions: CognitiveRegion[];
  /** Validation: counts, dominance, centroid spacing (see spec). */
  regionValidation: CognitiveRegionValidation;
  /**
   * Per-dimension routing scores on the unit interval (0–1), from {@link DimensionDisplayModel.rawPercent} ÷ 100.
   * Used for facilitator copy and any consumer that needs the same scale as the adaptive routing posteriors.
   */
  routingScores: CognitiveVector;
  /** Optional clusters (each ≥2 points) in projection space. */
  activationClusters: number[][];
  /** Pairs of global indices for faint trait relation lines. */
  traitEdges: [number, number][];
  /** Activations backing the constellation (same prefix order as map rows). */
  activations: CognitiveActivation[];
  hasSessionEmbedding: boolean;
  fingerprint: string;
  density: { grid: number[][]; cols: number; rows: number; maxD: number };
}

/**
 * Single pipeline: align vectors → joint PCA → normalized 2D + density field.
 * Views consume this object only; they must not re-run PCA.
 */
export function buildCognitiveModel(input: BuildCognitiveModelInput): CognitiveModel {
  const {
    embeddingVector,
    embeddingDimension,
    display,
    confidenceComponents,
    extraPoints = [],
    syntheticCount: syntheticCountIn,
  } = input;

  const routingScores: CognitiveVector = { ...DEFAULT_COGNITIVE_VECTOR };
  for (const d of ROUTING_WEIGHT_KEYS) {
    const raw = display.rawPercent[d];
    routingScores[d] =
      typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, Math.min(1, raw / 100)) : 0.5;
  }

  const hasSession = Boolean(embeddingVector && embeddingVector.length > 0);
  const dim = hasSession
    ? Math.max(embeddingDimension, embeddingVector!.length, 32)
    : Math.max(embeddingDimension, 32);

  let activations = mapAnswersToActivations({
    rawPercent: display.rawPercent,
    confidenceComponents,
    embeddingDimension: dim,
    sessionEmbedding: hasSession ? embeddingVector! : null,
  });
  activations = activations.filter((a) => a.weight > 1e-12);
  const weightSum = activations.reduce((s, a) => s + a.weight, 0);
  if (activations.length === 0 || weightSum < 1e-14) {
    activations = [];
  }

  const activationRows = activations.map((a) => a.vector);
  const k = activationRows.length;

  const refRows = getArchetypeLatentRows(dim);
  const extraRows = extraPoints.map((e) => alignVectorToDim(e.vector, dim));

  const seedRow = new Array(dim).fill(0);
  if (k > 0) {
    for (let i = 0; i < k; i++) {
      const w = activations[i]!.weight;
      const row = activationRows[i]!;
      for (let j = 0; j < dim; j++) {
        seedRow[j] += row[j]! * w;
      }
    }
  }
  const sw = k > 0 ? activations.reduce((s, a) => s + a.weight, 0) : 1;
  const seedVec = k > 0 ? seedRow.map((v) => v / sw) : liftRawPercentToEmbedding(display.rawPercent, dim);

  const rng = createRng(seedFromRows(seedVec, dim, extraRows.length));
  const synthCount = Math.max(0, Math.min(500, syntheticCountIn ?? SYNTHETIC_COUNT_DEFAULT));
  const syntheticRows = generateSyntheticPopulation(refRows, synthCount, SYNTHETIC_NOISE, rng);

  const matrix = [...activationRows, ...refRows, ...extraRows, ...syntheticRows];
  const planar = projectPointsTo2dPca(matrix);
  const norm = normalizePlanarCoords(planar, 0.055);

  const projectedPoints: ProjectedPoint2[] = norm.map((n) => ({ x: n.nx, y: n.ny }));

  const spreadWeights = activations.map((a) => a.weight);
  const jitterSeeds = activations.map((a) => a.traitId);
  spreadActivationProjections(projectedPoints, k, spreadWeights, jitterSeeds);

  const labels: string[] = [
    ...activations.map((a) => a.traitId),
    ...COGNITIVE_ARCHETYPES.map(() => 'Reference anchor'),
    ...extraPoints.map((e) => e.label),
    ...syntheticRows.map(() => ''),
  ];

  const kinds: CognitivePointKind[] = [
    ...activations.map(() => 'activation' as const),
    ...COGNITIVE_ARCHETYPES.map(() => 'archetype' as const),
    ...extraPoints.map(() => 'extra' as const),
    ...syntheticRows.map(() => 'synthetic' as const),
  ];

  const pointWeights = projectedPoints.map((_, i) => {
    if (i < k) return activations[i]!.weight;
    const kind = kinds[i];
    if (kind === 'archetype' || kind === 'extra') return 1;
    return 0.32;
  });

  let cx = 0;
  let cy = 0;
  let cw = 0;
  for (let i = 0; i < k; i++) {
    const w = activations[i]!.weight;
    cx += projectedPoints[i]!.x * w;
    cy += projectedPoints[i]!.y * w;
    cw += w;
  }
  const centroid: ProjectedPoint2 =
    cw > 0 ? { x: cx / cw, y: cy / cw } : projectedPoints[0] ?? { x: 0.5, y: 0.5 };

  const activationIndices = activations.map((_, i) => i);
  const activationDomains = activations.map((a) => a.domain);
  const { regions: cognitiveRegions, validation: regionValidation } = computeCognitiveRegions(
    activations,
    projectedPoints.slice(0, k)
  );
  const activationClusters = cognitiveRegions.map((r) => r.pointIndices);
  const clusterVisualBoost = buildClusterVisualBoost(projectedPoints.length, activationClusters);
  const activationClusterHints = buildActivationClusterHints(activationClusters, activationDomains, 2);
  const traitIds = activations.map((a) => a.traitId);
  const traitEdges = resolveTraitEdges(traitIds, TRAIT_RELATED_PAIRS);

  /** Density and point styling use raw per-trait weights only — no cluster boost (avoids a single dominant mass). */
  const raw = computeDensityGrid(projectedPoints, PLOT_INNER, PLOT_INNER, DENSITY_CELL, pointWeights);
  const smooth = smoothDensityGrid(raw.grid, SMOOTH_RADIUS);
  let maxD = 0;
  for (const row of smooth) {
    for (const v of row) maxD = Math.max(maxD, v);
  }
  if (maxD < 1e-9) maxD = 1;
  const dispEarly = activationSpatialDispersion(projectedPoints, k);
  const spanForPeaks = Math.max(dispEarly.spanX, dispEarly.spanY, 0.08);
  augmentDensityGridWithRegionPeaks(smooth, raw.cols, raw.rows, cognitiveRegions, spanForPeaks, maxD);
  maxD = 0;
  for (const row of smooth) {
    for (const v of row) maxD = Math.max(maxD, v);
  }
  if (maxD < 1e-9) maxD = 1;

  const embedding = new Array(dim).fill(0);
  for (let j = 0; j < dim; j++) {
    let s = 0;
    for (let i = 0; i < k; i++) {
      s += activationRows[i]![j]! * activations[i]!.weight;
    }
    embedding[j] = cw > 0 ? s / cw : 0;
  }

  const fingerprint = `${dim}-act${k}-${centroid.x.toFixed(3)}-${centroid.y.toFixed(3)}-${synthCount}`;

  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[PCMS activation field] buildCognitiveModel:',
      k,
      'activation(s) in model (full catalog); rendered points match this count in views'
    );
  }

  if (isPcmsDebugField() && k > 0) {
    const disp = activationSpatialDispersion(projectedPoints, k);
    console.log('[PCMS_DEBUG_FIELD] activation spatial dispersion', {
      ...disp,
      spanSum: Number((disp.spanX + disp.spanY).toFixed(4)),
      count: k,
    });
  }

  if (process.env.NODE_ENV === 'development' && k >= 2) {
    console.log({
      regions: cognitiveRegions.length,
      maxRegionWeightShare: regionValidation.maxRegionWeightShare,
      maxRegionPointShare: regionValidation.maxRegionPointShare,
      centroidDistances: regionValidation.centroidDistances,
      minCentroidDistance: regionValidation.minCentroidDistance,
      separationThreshold: regionValidation.separationThreshold,
      heavyOverlap: regionValidation.heavyOverlap,
      passedAllChecks: regionValidation.passedAllChecks,
    });
  }

  return {
    embedding,
    projectedPoints,
    allVectors: matrix,
    kinds,
    labels,
    pointWeights,
    clusterVisualBoost,
    activationClusterHints,
    cognitiveRegions,
    regionValidation,
    routingScores,
    centroid,
    activationIndices,
    activationDomains,
    activationClusters,
    traitEdges,
    activations: [...activations],
    hasSessionEmbedding: hasSession,
    fingerprint,
    density: { grid: smooth, cols: raw.cols, rows: raw.rows, maxD },
  };
}

export function dominantRoutingDimension(
  display: DimensionDisplayModel,
  confidence: ConfidenceComponents
): CognitiveDimension {
  let best: CognitiveDimension = ROUTING_WEIGHT_KEYS[0];
  let bestS = -1;
  for (const d of ROUTING_WEIGHT_KEYS) {
    const raw = display.rawPercent[d] ?? 50;
    const conf = confidence[d].finalConfidence;
    const s = Math.abs(raw - 50) * (0.35 + 0.65 * conf);
    if (s > bestS) {
      bestS = s;
      best = d;
    }
  }
  return best;
}
