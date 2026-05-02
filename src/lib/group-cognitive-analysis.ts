/**
 * Multi-profile (small-group) analysis: diversity, clusters, friction/environment signals,
 * and routing-based risk hints. Composes existing cohort modules; does not replace them.
 */
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import type { CognitiveModel } from '@/core/cognitive-pipeline';
import { buildCohortCognitiveMap } from '@/cohort/cohort-cognitive-map';
import { deriveEnvironmentSignals } from '@/cohort/environment-signals';
import { mapInteractionFriction } from '@/cohort/interaction-friction';
import type { CohortModel, EnvironmentSignal, FrictionSignal } from '@/cohort/types';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import type { CognitiveDimension } from '@/model/cognitive-dimensions';

export type GroupMemberInput = {
  /** Stable id for exports (e.g. `m0`). */
  id: string;
  /** Display label only; avoid PII in shared exports. */
  label: string;
  model: CognitiveModel;
  display: DimensionDisplayModel;
};

export type MemberCluster = {
  id: string;
  memberIndices: number[];
  /** Short aggregate hint (non-diagnostic). */
  summary: string;
  /** Mean raw-percent routing profile for this cluster (0–100). */
  routingCentroid: Record<CognitiveDimension, number>;
};

export type DiversityBreakdown = {
  /** 0–1, higher = more spread across people on routing dimensions. */
  score: number;
  perDimensionStd: Record<CognitiveDimension, number>;
  /** Mean pairwise Euclidean distance in 0–1 normalized routing space. */
  meanPairwiseDistance: number;
};

export type GroupRiskSeverity = 'low' | 'moderate' | 'elevated';

export type GroupRiskIndicator = {
  id: string;
  severity: GroupRiskSeverity;
  title: string;
  explanation: string;
  suggestion: string;
};

export type GroupCognitiveAnalysisReport = {
  version: 1;
  generatedAt: string;
  memberCount: number;
  memberLabels: string[];
  cohortModel: CohortModel;
  clusters: MemberCluster[];
  diversity: DiversityBreakdown;
  risks: GroupRiskIndicator[];
  frictionSignals: FrictionSignal[];
  environmentSignals: EnvironmentSignal[];
  recommendations: string[];
  summaryNarrative: string;
};

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function std(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function routingMatrix(members: GroupMemberInput[]): number[][] {
  return members.map((m) => ROUTING_WEIGHT_KEYS.map((d) => m.display.rawPercent[d] / 100));
}

function computeDiversity(members: GroupMemberInput[]): DiversityBreakdown {
  const perDimensionStd = {} as Record<CognitiveDimension, number>;
  for (const d of ROUTING_WEIGHT_KEYS) {
    perDimensionStd[d] = std(members.map((m) => m.display.rawPercent[d]));
  }
  const avgStd = mean(Object.values(perDimensionStd));
  /** Typical spread: ~0–35 on 0–100 scale; map gently to 0–1. */
  const score = Math.max(0, Math.min(1, avgStd / 32));

  const pts = routingMatrix(members);
  let pairSum = 0;
  let pairN = 0;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      let s = 0;
      for (let k = 0; k < pts[i]!.length; k++) s += (pts[i]![k]! - pts[j]![k]!) ** 2;
      pairSum += Math.sqrt(s);
      pairN++;
    }
  }
  const meanPairwiseDistance = pairN > 0 ? pairSum / pairN : 0;

  return { score, perDimensionStd, meanPairwiseDistance };
}

function euclidean(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(s);
}

/** Lloyd k-means; deterministic init by spreading index picks across sorted order of profile mass. */
export function clusterMembersByRoutingVectors(points: number[][], kIn: number): number[] {
  const n = points.length;
  const d = points[0]?.length ?? 0;
  if (n === 0 || d === 0) return [];
  const k = Math.max(1, Math.min(kIn, n));
  if (k === 1) return new Array(n).fill(0);

  const mass = points.map((p) => p.reduce((a, b) => a + b, 0));
  const order = mass
    .map((v, i) => ({ v, i }))
    .sort((a, b) => a.v - b.v)
    .map((x) => x.i);
  const centroids: number[][] = [];
  for (let c = 0; c < k; c++) {
    const pick = order[Math.min(order.length - 1, Math.floor((c * (n - 1)) / Math.max(1, k - 1)))];
    centroids.push([...points[pick]!]);
  }

  const assignment = new Array(n).fill(0);
  for (let it = 0; it < 18; it++) {
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const dist = euclidean(points[i]!, centroids[c]!);
        if (dist < bestD) {
          bestD = dist;
          best = c;
        }
      }
      assignment[i] = best;
    }
    const sums = Array.from({ length: k }, () => new Array(d).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const c = assignment[i]!;
      counts[c]++;
      for (let j = 0; j < d; j++) sums[c]![j] += points[i]![j]!;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue;
      for (let j = 0; j < d; j++) centroids[c]![j] = sums[c]![j]! / counts[c]!;
    }
  }
  return assignment;
}

function buildMemberClusters(members: GroupMemberInput[], assignment: number[]): MemberCluster[] {
  const k = assignment.length ? Math.max(...assignment) + 1 : 0;
  const out: MemberCluster[] = [];
  for (let c = 0; c < k; c++) {
    const idxs: number[] = [];
    for (let i = 0; i < assignment.length; i++) {
      if (assignment[i] === c) idxs.push(i);
    }
    if (idxs.length === 0) continue;
    const centroid = {} as Record<CognitiveDimension, number>;
    for (const dim of ROUTING_WEIGHT_KEYS) {
      const vals = idxs.map((i) => members[i]!.display.rawPercent[dim]);
      centroid[dim] = Math.round(mean(vals) * 10) / 10;
    }
    const hi = [...ROUTING_WEIGHT_KEYS].sort((a, b) => centroid[b]! - centroid[a]!).slice(0, 2);
    const summary = `Emphasis toward ${hi[0]}/${hi[1]} routing signals in this subset (aggregate only).`;
    out.push({
      id: `cluster-${c}`,
      memberIndices: idxs,
      summary,
      routingCentroid: centroid,
    });
  }
  return out;
}

function deriveRoutingRisks(
  members: GroupMemberInput[],
  cohortModel: CohortModel,
  friction: FrictionSignal[]
): GroupRiskIndicator[] {
  const risks: GroupRiskIndicator[] = [];
  const rStd = std(members.map((m) => m.display.rawPercent.R));
  const cStd = std(members.map((m) => m.display.rawPercent.C));
  const sMax = Math.max(...members.map((m) => m.display.rawPercent.S));
  const sMean = mean(members.map((m) => m.display.rawPercent.S));

  if (rStd >= 17 || cStd >= 17) {
    const sev: GroupRiskSeverity = rStd >= 24 || cStd >= 24 ? 'elevated' : 'moderate';
    risks.push({
      id: 'structure_routine_spread',
      severity: sev,
      title: 'Spread in planning and structure preferences',
      explanation:
        'People in this set differ meaningfully on routine/planning-related routing signals. Unstructured or frequently changing environments can increase friction when some members strongly prefer predictability.',
      suggestion:
        'Use visible agendas, timeboxed segments, and advance notice when plans change—without singling anyone out.',
    });
  }

  if (sMean >= 54 || sMax >= 64) {
    risks.push({
      id: 'sensory_load',
      severity: sMax >= 72 ? 'elevated' : 'moderate',
      title: 'Elevated sensory sensitivity in the set',
      explanation:
        'At least one profile shows relatively high sensory-reactivity routing signal; noisy or visually busy spaces may be harder for part of the group.',
      suggestion:
        'Prefer lower background noise, steady lighting, and optional quiet breakout where possible.',
    });
  }

  if (cohortModel.regionBalance < 0.36 && members.length >= 3) {
    risks.push({
      id: 'polarized_trait_field',
      severity: 'moderate',
      title: 'Polarized aggregate pattern',
      explanation:
        'Weight in the pooled map concentrates unevenly across regions—several distinct “modes” of emphasis may coexist.',
      suggestion:
        'Parallel tracks (e.g. written brief + optional deep dive) and explicit norms for pacing help diverse styles coexist.',
    });
  }

  const topF = friction[0];
  if (topF && topF.strength >= 0.38) {
    risks.push({
      id: 'aggregate_style_tension',
      severity: topF.strength >= 0.55 ? 'elevated' : 'moderate',
      title: 'Strong aggregate style contrast',
      explanation: topF.explanation,
      suggestion: topF.suggestion,
    });
  }

  if (risks.length === 0) {
    risks.push({
      id: 'no_major_flags',
      severity: 'low',
      title: 'No strong aggregate risk flags',
      explanation:
        'This quick scan did not surface extreme spreads on the dimensions checked. It remains a descriptive overview, not a prediction of outcomes.',
      suggestion: 'Revisit after adding more profiles or context if you are designing a specific environment.',
    });
  }

  return risks;
}

function mergeRecommendations(
  env: EnvironmentSignal[],
  friction: FrictionSignal[],
  risks: GroupRiskIndicator[]
): string[] {
  const lines: string[] = [];
  for (const e of env.slice(0, 4)) {
    lines.push(e.narrative);
  }
  for (const f of friction.slice(0, 2)) {
    lines.push(f.suggestion);
  }
  for (const r of risks) {
    if (r.severity !== 'low') lines.push(r.suggestion);
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of lines) {
    const k = l.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out.slice(0, 12);
}

function buildNarrative(
  members: GroupMemberInput[],
  diversity: DiversityBreakdown,
  cohortModel: CohortModel,
  clusters: MemberCluster[],
  risks: GroupRiskIndicator[]
): string {
  const n = members.length;
  const div = (diversity.score * 100).toFixed(0);
  const cl = clusters.length;
  const topRisk = risks.find((r) => r.severity !== 'low') ?? risks[0];
  return [
    `This overview combines ${n} profiles in one pooled map and routing-based statistics.`,
    `Diversity index (spread across F–V routing dimensions) is about ${div}% of the model’s scale—higher means more difference between people on those summaries.`,
    cohortModel.summaryExplanation.split('. ').slice(0, 2).join('. ') + '.',
    `A simple clustering on normalized routing vectors suggests ${cl} subset(s) for discussion planning only.`,
    topRisk
      ? `A notable theme: ${topRisk.title.toLowerCase()} — ${topRisk.explanation.slice(0, 220)}${topRisk.explanation.length > 220 ? '…' : ''}`
      : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Full multi-profile analysis. Requires at least two {@link GroupMemberInput} rows.
 */
export function analyzeMultiProfileGroup(members: GroupMemberInput[]): GroupCognitiveAnalysisReport {
  if (members.length < 2) {
    throw new Error('analyzeMultiProfileGroup: need at least two members');
  }
  const models = members.map((m) => m.model);
  const cohortModel = buildCohortCognitiveMap(models);
  const environmentSignals = deriveEnvironmentSignals(cohortModel);
  const frictionSignals = mapInteractionFriction(cohortModel);
  const diversity = computeDiversity(members);
  const kTarget = members.length <= 3 ? 2 : Math.min(3, Math.ceil(members.length / 2));
  const pts = routingMatrix(members);
  const assignment = clusterMembersByRoutingVectors(pts, kTarget);
  const clusters = buildMemberClusters(members, assignment);
  const risks = deriveRoutingRisks(members, cohortModel, frictionSignals);
  const recommendations = mergeRecommendations(environmentSignals, frictionSignals, risks);
  const summaryNarrative = buildNarrative(members, diversity, cohortModel, clusters, risks);

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    memberCount: members.length,
    memberLabels: members.map((m) => m.label),
    cohortModel,
    clusters,
    diversity,
    risks,
    frictionSignals,
    environmentSignals,
    recommendations,
    summaryNarrative,
  };
}

/** JSON-safe subset for export (avoids huge coordinate arrays). */
export function toPortableGroupAnalysisJson(report: GroupCognitiveAnalysisReport) {
  const cm = report.cohortModel;
  return {
    version: report.version,
    generatedAt: report.generatedAt,
    memberCount: report.memberCount,
    memberLabels: report.memberLabels,
    diversity: report.diversity,
    clusters: report.clusters,
    risks: report.risks,
    frictionSignals: report.frictionSignals,
    environmentSignals: report.environmentSignals,
    recommendations: report.recommendations,
    summaryNarrative: report.summaryNarrative,
    cohortSummary: {
      diversityIndex: cm.diversityIndex,
      regionBalance: cm.regionBalance,
      regionCount: cm.regions.length,
      dominantTraits: cm.dominantTraits.slice(0, 12),
      summaryExplanation: cm.summaryExplanation,
      spreadMetrics: cm.spreadMetrics,
    },
  };
}
