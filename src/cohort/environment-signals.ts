import type { CohortModel, EnvironmentSignal } from '@/cohort/types';

/**
 * Trait → environment construct: descriptive drivers, not medical claims.
 * Values are trait ids that lift the corresponding environment signal when their cohort share is high.
 */
const SIGNAL_DRIVERS: {
  id: string;
  traitIds: string[];
  narrative: string;
  explanation: string;
}[] = [
  {
    id: 'sensory_load',
    traitIds: ['sensory_sensitivity', 'environmental_granularity'],
    narrative:
      'This environment may benefit from reduced noise and lighting variability when group-level sensitivity to sensory change is elevated.',
    explanation:
      'Derived from pooled weight on sensory granularity constructs; suggests reviewing steady ambient conditions rather than individual needs.',
  },
  {
    id: 'interruption_load',
    traitIds: ['attention_switching', 'cognitive_breadth'],
    narrative:
      'This environment may benefit from clearer boundaries around interruptions when many members show high attention-switching emphasis.',
    explanation:
      'Aggregated attentional switching constructs suggest friction when interruptions are frequent or unpredictable.',
  },
  {
    id: 'uninterrupted_blocks',
    traitIds: ['sustained_focus', 'precision_drive'],
    narrative:
      'This environment may benefit from predictable blocks of uninterrupted time when sustained-focus constructs are strongly represented.',
    explanation:
      'Pooled sustained-focus and precision emphasis supports calendar practices that protect contiguous focus intervals.',
  },
  {
    id: 'group_interaction_load',
    traitIds: ['interpersonal_sensitivity', 'collaborative_openness', 'direct_communication'],
    narrative:
      'This environment may benefit from explicit communication norms when social-channel constructs are collectively salient.',
    explanation:
      'Combined interpersonal and communication constructs are elevated; clear agendas and turn-taking may reduce ambiguous social load.',
  },
  {
    id: 'structure_predictability',
    traitIds: ['routine_affinity', 'system_thinking', 'linear_inference'],
    narrative:
      'This environment may benefit from predictable structure and visible sequencing when routine and system-oriented constructs dominate.',
    explanation:
      'Aggregate weight on structure-seeking constructs suggests value in stable cadence and explicit ordering of activities.',
  },
];

/** Normalized cohort-level mass per construct (aggregate-only). */
export function cohortTraitShares(model: CohortModel): Map<string, number> {
  const m = new Map<string, number>();
  const tw = model.regions.reduce((s, r) => s + r.weight, 0) || 1;
  for (const r of model.regions) {
    const rw = r.weight / tw;
    for (const [tid, w] of Object.entries(r.traitDistribution)) {
      m.set(tid, (m.get(tid) ?? 0) + w * rw);
    }
  }
  const sum = [...m.values()].reduce((a, b) => a + b, 0) || 1;
  for (const k of [...m.keys()]) m.set(k, (m.get(k) ?? 0) / sum);
  return m;
}

/**
 * Translate aggregate trait distribution into environment-level, non-prescriptive signals.
 */
export function deriveEnvironmentSignals(model: CohortModel): EnvironmentSignal[] {
  const shares = cohortTraitShares(model);
  const nTraits = Math.max(1, shares.size);
  const out: EnvironmentSignal[] = [];

  for (const def of SIGNAL_DRIVERS) {
    let num = 0;
    let den = 0;
    for (const tid of def.traitIds) {
      const s = shares.get(tid) ?? 0;
      num += s;
      den += 1;
    }
    const raw = den > 0 ? num / den : 0;
    /** Normalize against cohort: rescale by how "lifted" drivers are vs uniform baseline */
    const baseline = 1 / Math.max(8, nTraits);
    const intensity = Math.max(0, Math.min(1, raw / (baseline * 2.5 + 1e-9)));
    const confidence = Math.min(
      1,
      Math.sqrt(model.cohortPoints.length / 12) * (model.regions.length >= 2 ? 1 : 0.75)
    );

    out.push({
      id: def.id,
      intensity,
      confidence,
      narrative: def.narrative,
      explanation: def.explanation,
    });
  }

  return out.sort((a, b) => b.intensity * b.confidence - a.intensity * a.confidence);
}
