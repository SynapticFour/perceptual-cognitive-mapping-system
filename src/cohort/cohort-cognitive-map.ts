/**
 * Cohort-level cognitive map: pools activations from many {@link CognitiveModel}s into one
 * shared 2D projection and regional structure — aggregate only, not attributable to individuals.
 * @see docs/COHORT-INTELLIGENCE.md
 */
import type { CognitiveModel } from '@/core/cognitive-pipeline';
import type { CognitiveActivation } from '@/core/traits/types';
import {
  alignVectorToDim,
  activationSpatialDispersion,
  normalizePlanarCoords,
  projectPointsTo2dPca,
} from '@/lib/cognitive-map-projection';
import { computeCognitiveRegions, type CognitiveRegion } from '@/lib/cognitive-regions';
import type { CohortModel, CohortRegion, CohortSpreadMetrics } from '@/cohort/types';

function maxDim(models: CognitiveModel[]): number {
  let d = 32;
  for (const m of models) {
    d = Math.max(d, m.embedding.length, ...m.activations.map((a) => a.vector.length));
  }
  return d;
}

function aggregateTraitMass(activations: CognitiveActivation[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of activations) {
    m.set(a.traitId, (m.get(a.traitId) ?? 0) + a.weight);
  }
  return m;
}

/** Variance of normalized trait-mass shares (higher = more spread across constructs). */
function diversityIndexFromMass(mass: Map<string, number>): number {
  const vals = [...mass.values()];
  const s = vals.reduce((a, b) => a + b, 0) || 1;
  const p = vals.map((v) => v / s);
  if (p.length <= 1) return 0;
  const mean = 1 / p.length;
  return p.reduce((acc, x) => acc + (x - mean) ** 2, 0) / p.length;
}

function regionBalanceEntropy(regionWeights: number[]): number {
  const s = regionWeights.reduce((a, b) => a + b, 0) || 1;
  const p = regionWeights.map((w) => w / s).filter((x) => x > 1e-12);
  if (p.length <= 1) return p.length === 1 ? 1 : 0;
  let h = 0;
  for (const x of p) h -= x * Math.log(x);
  return h / Math.log(p.length);
}

function traitDistributionForRegion(
  indices: number[],
  activations: CognitiveActivation[]
): Record<string, number> {
  const raw = new Map<string, number>();
  for (const i of indices) {
    const a = activations[i]!;
    raw.set(a.traitId, (raw.get(a.traitId) ?? 0) + a.weight);
  }
  const sum = [...raw.values()].reduce((a, b) => a + b, 0) || 1;
  const out: Record<string, number> = {};
  for (const [k, v] of raw) out[k] = v / sum;
  return out;
}

function mapCognitiveRegionToCohort(r: CognitiveRegion, activations: CognitiveActivation[]): CohortRegion {
  return {
    id: r.id,
    centroid: { ...r.centroid },
    weight: r.strength,
    traitDistribution: traitDistributionForRegion(r.pointIndices, activations),
    topTraitIds: [...r.topTraitIds],
    primaryDomain: r.primaryDomain,
  };
}

function fallbackSingleRegion(
  activations: CognitiveActivation[],
  projected: { x: number; y: number }[]
): CohortRegion[] {
  if (activations.length === 0) return [];
  const w = activations.reduce((s, a) => s + a.weight, 0) || 1;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < activations.length; i++) {
    const p = projected[i]!;
    const ww = activations[i]!.weight;
    sx += p.x * ww;
    sy += p.y * ww;
  }
  sx /= w;
  sy /= w;
  const dist = traitDistributionForRegion(
    activations.map((_, i) => i),
    activations
  );
  const topTraitIds = Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  return [
    {
      id: 'cohort-r0',
      centroid: { x: sx, y: sy },
      weight: w,
      traitDistribution: dist,
      topTraitIds,
      primaryDomain: activations[0]!.domain,
    },
  ];
}

/**
 * Pool activations from many {@link CognitiveModel}s, project into one shared 2D basis, cluster like individuals.
 * Does not retain which user contributed which point (caller must not merge identifiable metadata).
 */
export function buildCohortCognitiveMap(models: CognitiveModel[]): CohortModel {
  const dim = maxDim(models);
  const activations: CognitiveActivation[] = [];
  for (const m of models) {
    for (const a of m.activations) {
      activations.push({
        traitId: a.traitId,
        domain: a.domain,
        vector: alignVectorToDim(a.vector, dim),
        weight: a.weight,
      });
    }
  }

  if (activations.length === 0) {
    return {
      regions: [],
      diversityIndex: 0,
      dominantTraits: [],
      spreadMetrics: { spanX: 0, spanY: 0, varianceX: 0, varianceY: 0 },
      regionBalance: 0,
      cohortPoints: [],
      cohortWeights: [],
      summaryExplanation:
        'Not enough pooled activations to summarize a cohort map; more aggregate input may help.',
    };
  }

  const matrix = activations.map((a) => a.vector);
  const planar = projectPointsTo2dPca(matrix);
  const norm = normalizePlanarCoords(planar, 0.055);
  const projectedPoints = norm.map((n) => ({ x: n.nx, y: n.ny }));

  const { regions: cr, validation } = computeCognitiveRegions(activations, projectedPoints);
  let cohortRegions: CohortRegion[] = cr.map((r) => mapCognitiveRegionToCohort(r, activations));

  if (cohortRegions.length === 0 && activations.length >= 1) {
    cohortRegions = fallbackSingleRegion(activations, projectedPoints);
  }

  const mass = aggregateTraitMass(activations);
  const div = diversityIndexFromMass(mass);
  const totalM = [...mass.values()].reduce((a, b) => a + b, 0) || 1;
  const dominantTraits = [...mass.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([traitId, w]) => ({ traitId, share: w / totalM }));

  const rw = cohortRegions.map((r) => r.weight);
  const rb = regionBalanceEntropy(rw);

  const n = activations.length;
  const disp = activationSpatialDispersion(projectedPoints, n);
  const spreadMetrics: CohortSpreadMetrics = {
    spanX: disp.spanX,
    spanY: disp.spanY,
    varianceX: disp.varianceX,
    varianceY: disp.varianceY,
  };

  const summaryExplanation = [
    `This cohort map pools ${n} activation points from ${models.length} profile(s) in one shared projection.`,
    validation.passedAllChecks
      ? 'Regional structure passes the same balance checks used for individual maps.'
      : 'Regional structure is approximate; some separation checks did not fully pass—interpret as soft grouping.',
    'Trait diversity (variance of construct mass) is summarized as diversityIndex; regionBalance reflects how evenly weight sits across regions.',
  ].join(' ');

  return {
    regions: cohortRegions,
    diversityIndex: div,
    dominantTraits,
    spreadMetrics,
    regionBalance: rb,
    cohortPoints: projectedPoints,
    cohortWeights: activations.map((a) => a.weight),
    summaryExplanation,
  };
}
