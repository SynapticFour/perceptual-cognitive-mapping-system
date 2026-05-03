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
  /**
   * Mean Shannon entropy of softmax-normalized routing vectors (natural log), scaled to 0–1 by `ln(K)` for K routing dimensions.
   * Higher ≈ profiles less “peaked” on the same dominant axis (diverse emphases).
   */
  routingProfileEntropy01: number;
};

/** Optional facilitator rating of the *setting* (not people): all in [0,1]. */
export type EnvironmentStressProfile = {
  /** 1 = highly predictable / stable; 0 = chaotic / unpredictable. */
  predictability01: number;
  /** 0 = calm sensory context; 1 = high stimulation (noise, crowding, visual load). */
  stimulation01: number;
  /** 0 = few interruptions; 1 = frequent interruptions. */
  interruption01: number;
};

export type GroupAnalysisOptions = {
  environment?: EnvironmentStressProfile;
  /** Override automatic cluster count (otherwise derived from group size). */
  kClusters?: number;
};

export type RecommendationCategory =
  | 'environment_design'
  | 'temporal_structure'
  | 'sensory_access'
  | 'social_norms';

export type GroupRecommendationItem = {
  id: string;
  category: RecommendationCategory;
  text: string;
  rationale: string;
  relatedRiskIds: string[];
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
  /** Typed, actionable items (deterministic order by `id`). */
  recommendationItems: GroupRecommendationItem[];
  /** Echo of optional environment profile used for mismatch rules. */
  environment?: EnvironmentStressProfile;
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

function softmaxEntropy01(row: number[]): number {
  const s = row.reduce((a, b) => a + b, 0) || 1e-9;
  let h = 0;
  for (const v of row) {
    const p = Math.max(1e-12, v / s);
    h -= p * Math.log(p);
  }
  return Math.max(0, Math.min(1, h / Math.log(ROUTING_WEIGHT_KEYS.length)));
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
  const routingProfileEntropy01 =
    pts.length > 0 ? mean(pts.map((row) => softmaxEntropy01(row))) : 0;

  return { score, perDimensionStd, meanPairwiseDistance, routingProfileEntropy01 };
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

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0.5;
  return Math.max(0, Math.min(1, x));
}

/**
 * Person–environment style *mismatch* hints: aggregate routing vs facilitator-rated context.
 * Non-diagnostic; does not name individuals.
 */
export function deriveEnvironmentMismatchRisks(
  members: GroupMemberInput[],
  env: EnvironmentStressProfile
): GroupRiskIndicator[] {
  const risks: GroupRiskIndicator[] = [];
  const p = clamp01(env.predictability01);
  const st = clamp01(env.stimulation01);
  const inter = clamp01(env.interruption01);
  const rMean = mean(members.map((m) => m.display.rawPercent.R));
  const sMean = mean(members.map((m) => m.display.rawPercent.S));
  const fMean = mean(members.map((m) => m.display.rawPercent.F));

  if (rMean >= 56 && p <= 0.38) {
    risks.push({
      id: 'structure_need_chaotic_env',
      severity: rMean >= 64 && p <= 0.28 ? 'elevated' : 'moderate',
      title: 'Structure emphasis vs low environmental predictability',
      explanation:
        'Aggregate routing signals lean toward planning and sequencing, while the described environment is low on predictability. That pairing can increase coordination load for the group as a whole.',
      suggestion:
        'Publish stable sequences, give advance notice before changes, and avoid surprise reshuffles mid-block unless the group explicitly opts in.',
    });
  }

  if (sMean >= 52 && st >= 0.58) {
    risks.push({
      id: 'sensory_environment_mismatch',
      severity: sMean >= 60 && st >= 0.72 ? 'elevated' : 'moderate',
      title: 'Sensory sensitivity vs high-stimulation setting',
      explanation:
        'Average sensory-reactivity routing signal is elevated while the environment is rated as high-stimulation. Some participants may fatigue faster in that combination.',
      suggestion:
        'Offer lower-stimulation breakout options, steady lighting, and predictable quiet intervals.',
    });
  }

  if (fMean >= 56 && inter >= 0.62) {
    risks.push({
      id: 'focus_interruption_mismatch',
      severity: fMean >= 64 && inter >= 0.75 ? 'elevated' : 'moderate',
      title: 'Attention-channel emphasis vs interrupt-heavy context',
      explanation:
        'Aggregate attention-related routing signal is relatively high while interruptions are rated frequent—shared calendars may otherwise fight the context.',
      suggestion:
        'Define explicit focus blocks, interruption windows, and a single “source of truth” schedule.',
    });
  }

  return risks;
}

function dedupeRisksById(risks: GroupRiskIndicator[]): GroupRiskIndicator[] {
  const seen = new Set<string>();
  const out: GroupRiskIndicator[] = [];
  for (const r of risks) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
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

type RecommendationInput = Pick<
  GroupCognitiveAnalysisReport,
  'risks' | 'diversity' | 'environmentSignals' | 'frictionSignals'
>;

/**
 * Deterministic recommendation objects derived from risks, diversity, and environment signals.
 */
export function buildStructuredRecommendationItems(input: RecommendationInput): GroupRecommendationItem[] {
  const riskIds = new Set(input.risks.map((r) => r.id));
  const items: GroupRecommendationItem[] = [];

  if (riskIds.has('structure_need_chaotic_env')) {
    items.push({
      id: 'rec_temporal_visible_sequence',
      category: 'temporal_structure',
      text: 'Use a visible running order and “next / now / later” cues; announce changes before they land.',
      rationale:
        'Aligns low environmental predictability with aggregate structure-seeking routing signals (descriptive, not predictive).',
      relatedRiskIds: ['structure_need_chaotic_env'],
    });
  }

  if (riskIds.has('sensory_environment_mismatch')) {
    items.push({
      id: 'rec_sensory_low_stimulation',
      category: 'sensory_access',
      text: 'Prefer quieter breakout zones, steady lighting, and optional low-stimulus breaks.',
      rationale: 'Pairs elevated aggregate sensory signal with a high-stimulation environment rating.',
      relatedRiskIds: ['sensory_environment_mismatch'],
    });
  }

  if (riskIds.has('focus_interruption_mismatch')) {
    items.push({
      id: 'rec_interruption_norms',
      category: 'social_norms',
      text: 'Agree on interruption windows versus deep-focus blocks and a visible “do not disturb” convention.',
      rationale: 'Reduces tension between aggregate attention-channel emphasis and interrupt-heavy contexts.',
      relatedRiskIds: ['focus_interruption_mismatch'],
    });
  }

  if (riskIds.has('sensory_load')) {
    items.push({
      id: 'rec_sensory_design_review',
      category: 'environment_design',
      text: 'Review ambient noise and lighting defaults; offer opt-out from the loudest joint activities.',
      rationale: 'Responds to the aggregate sensory_load routing flag.',
      relatedRiskIds: ['sensory_load'],
    });
  }

  if (input.diversity.score >= 0.55) {
    items.push({
      id: 'rec_diversity_parallel_tracks',
      category: 'social_norms',
      text: 'Offer parallel information tracks (short brief plus optional deep dive) so mixed styles stay legitimate.',
      rationale: 'High routing diversity suggests several co-existing emphases in the same roster.',
      relatedRiskIds: [],
    });
  }

  for (const e of input.environmentSignals.slice(0, 2)) {
    items.push({
      id: `rec_env_${e.id}`,
      category: 'environment_design',
      text: e.narrative,
      rationale: e.explanation,
      relatedRiskIds: [],
    });
  }

  for (const f of input.frictionSignals.slice(0, 1)) {
    if (f.strength < 0.35) continue;
    const key = `${f.traits[0]}_${f.traits[1]}`.replace(/[^a-z0-9_]+/gi, '_');
    items.push({
      id: `rec_friction_${key}`,
      category: 'social_norms',
      text: f.suggestion,
      rationale: f.explanation,
      relatedRiskIds: [],
    });
  }

  items.sort((a, b) => a.id.localeCompare(b.id));
  const seen = new Set<string>();
  const dedup: GroupRecommendationItem[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    dedup.push(it);
  }
  return dedup.slice(0, 16);
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
 * Optional {@link GroupAnalysisOptions.environment} adds deterministic person–environment mismatch flags.
 */
export function analyzeMultiProfileGroup(
  members: GroupMemberInput[],
  options?: GroupAnalysisOptions
): GroupCognitiveAnalysisReport {
  if (members.length < 2) {
    throw new Error('analyzeMultiProfileGroup: need at least two members');
  }
  const models = members.map((m) => m.model);
  const cohortModel = buildCohortCognitiveMap(models);
  const environmentSignals = deriveEnvironmentSignals(cohortModel);
  const frictionSignals = mapInteractionFriction(cohortModel);
  const diversity = computeDiversity(members);
  const kTarget =
    options?.kClusters ??
    (members.length <= 3 ? 2 : Math.min(3, Math.ceil(members.length / 2)));
  const pts = routingMatrix(members);
  const assignment = clusterMembersByRoutingVectors(pts, kTarget);
  const clusters = buildMemberClusters(members, assignment);
  const env = options?.environment;
  const mismatch = env ? deriveEnvironmentMismatchRisks(members, env) : [];
  const risks = dedupeRisksById([...mismatch, ...deriveRoutingRisks(members, cohortModel, frictionSignals)]);
  const recommendations = mergeRecommendations(environmentSignals, frictionSignals, risks);
  const recommendationItems = buildStructuredRecommendationItems({
    risks,
    diversity,
    environmentSignals,
    frictionSignals,
  });
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
    recommendationItems,
    environment: env,
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
    recommendationItems: report.recommendationItems,
    environment: report.environment,
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
