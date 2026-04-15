import { projectCognitiveVectorToLatentSpace } from '@/lib/cognitive-map-projection';
import type { CognitiveDimension, CognitiveVector } from '@/model/cognitive-dimensions';
import { DEFAULT_COGNITIVE_VECTOR } from '@/model/cognitive-dimensions';
import type { TraitDomain } from '@/core/traits/trait-domains';

/** Canonical width for `baseVector` on each {@link TraitDefinition}; align to session `dim` at runtime. */
export const CANONICAL_TRAIT_EMBEDDING_DIM = 32;

/** Which routing dimensions contribute to weight, and the [0,1] profile that maximizes activation. */
export type TraitMappingPole = Readonly<{
  dimension: CognitiveDimension;
  /** Routing-space value (0–1) where this trait is considered most active. */
  expected: number;
}>;

export type TraitDefinition = Readonly<{
  id: string;
  domain: TraitDomain;
  /** One-line construct meaning (non-diagnostic). */
  description: string;
  /** Normalized latent direction in ℝ^{@link CANONICAL_TRAIT_EMBEDDING_DIM}} (L2 unit). */
  baseVector: number[];
  /** Observables used for activation weight (same routing model as the questionnaire). */
  mapping: readonly TraitMappingPole[];
}>;

function cognitiveVectorFromPoles(poles: readonly TraitMappingPole[]): CognitiveVector {
  const v: CognitiveVector = { ...DEFAULT_COGNITIVE_VECTOR };
  for (const p of poles) {
    v[p.dimension] = Math.max(0, Math.min(1, p.expected));
  }
  return v;
}

/** L2-normalize; if degenerate, return uniform fallback. */
export function normalizeTraitBaseVector(v: number[]): number[] {
  let s = 0;
  for (const x of v) s += x * x;
  const n = Math.sqrt(s);
  if (n < 1e-12) {
    const u = 1 / Math.sqrt(Math.max(1, v.length));
    return v.map(() => u);
  }
  return v.map((x) => x / n);
}

function buildBaseVector(cognitive: CognitiveVector): number[] {
  const lifted = projectCognitiveVectorToLatentSpace(cognitive, CANONICAL_TRAIT_EMBEDDING_DIM);
  return normalizeTraitBaseVector(lifted);
}

function def(
  id: string,
  domain: TraitDomain,
  description: string,
  mapping: readonly TraitMappingPole[]
): TraitDefinition {
  const cognitive = cognitiveVectorFromPoles(mapping);
  return {
    id,
    domain,
    description,
    mapping,
    baseVector: buildBaseVector(cognitive),
  };
}

/**
 * Curated micro-traits: atomic-ish constructs, even granularity, no clinical labels.
 * Weights come only from `mapping` poles × user routing scores (see `trait-mapping.ts`).
 */
const TRAIT_DEFINITION_LIST: TraitDefinition[] = [
  def(
    'sensory_sensitivity',
    'perception',
    'Fine-grained pickup of sensory intensity and change.',
    [
      { dimension: 'S', expected: 0.86 },
      { dimension: 'E', expected: 0.48 },
    ]
  ),
  def(
    'environmental_granularity',
    'perception',
    'Preference for parsing scenes into distinct sensory channels.',
    [
      { dimension: 'S', expected: 0.72 },
      { dimension: 'V', expected: 0.58 },
    ]
  ),
  def(
    'temporal_perception',
    'perception',
    'Salience of timing, rhythm, and temporal structure in input.',
    [
      { dimension: 'T', expected: 0.8 },
      { dimension: 'S', expected: 0.46 },
    ]
  ),
  def(
    'pattern_recognition',
    'cognition',
    'Reliance on repeating structure and regularities across cases.',
    [
      { dimension: 'P', expected: 0.86 },
      { dimension: 'F', expected: 0.55 },
    ]
  ),
  def(
    'abstract_thinking',
    'cognition',
    'Comfort moving away from concrete instances toward relations and invariants.',
    [
      { dimension: 'P', expected: 0.82 },
      { dimension: 'R', expected: 0.38 },
    ]
  ),
  def(
    'detail_orientation',
    'cognition',
    'Emphasis on local precision and concrete features over global gist.',
    [
      { dimension: 'F', expected: 0.78 },
      { dimension: 'P', expected: 0.38 },
    ]
  ),
  def(
    'system_thinking',
    'cognition',
    'Preference for stable rules, dependencies, and end-to-end structure.',
    [
      { dimension: 'R', expected: 0.85 },
      { dimension: 'P', expected: 0.6 },
    ]
  ),
  def(
    'associative_thinking',
    'cognition',
    'Wide, cross-linked retrieval and lateral connections between ideas.',
    [
      { dimension: 'A', expected: 0.86 },
      { dimension: 'V', expected: 0.52 },
    ]
  ),
  def(
    'metaphorical_thinking',
    'cognition',
    'Use of analogy and layered meaning rather than single literal readings.',
    [
      { dimension: 'P', expected: 0.64 },
      { dimension: 'A', expected: 0.78 },
    ]
  ),
  def(
    'linear_inference',
    'cognition',
    'Stepwise, convergent reasoning chains with explicit ordering.',
    [
      { dimension: 'R', expected: 0.8 },
      { dimension: 'A', expected: 0.36 },
    ]
  ),
  def(
    'verbal_semantic',
    'cognition',
    'Weight on language-like symbolic structure versus purely spatial codes.',
    [
      { dimension: 'V', expected: 0.84 },
      { dimension: 'P', expected: 0.5 },
    ]
  ),
  def(
    'spatial_holistic',
    'cognition',
    'Gestalt-like spatial and configurational processing.',
    [
      { dimension: 'V', expected: 0.58 },
      { dimension: 'A', expected: 0.72 },
    ]
  ),
  def(
    'sustained_focus',
    'attention',
    'Maintenance of a narrow attentional channel over time.',
    [
      { dimension: 'F', expected: 0.88 },
      { dimension: 'C', expected: 0.42 },
    ]
  ),
  def(
    'attention_switching',
    'attention',
    'Frequent re-allocation of attention between streams or goals.',
    [
      { dimension: 'C', expected: 0.82 },
      { dimension: 'F', expected: 0.4 },
    ]
  ),
  def(
    'cognitive_breadth',
    'attention',
    'Parallel monitoring of several conceptual threads at once.',
    [
      { dimension: 'C', expected: 0.72 },
      { dimension: 'A', expected: 0.68 },
    ]
  ),
  def(
    'emotional_reactivity',
    'regulation',
    'Amplitude and speed of affect-linked arousal to events.',
    [
      { dimension: 'E', expected: 0.78 },
      { dimension: 'I', expected: 0.55 },
    ]
  ),
  def(
    'interoceptive_awareness',
    'regulation',
    'Accessibility and granularity of internal bodily signals.',
    [
      { dimension: 'I', expected: 0.86 },
      { dimension: 'S', expected: 0.5 },
    ]
  ),
  def(
    'delay_gratification',
    'regulation',
    'Willingness to defer output for longer-horizon structure.',
    [
      { dimension: 'R', expected: 0.74 },
      { dimension: 'T', expected: 0.7 },
    ]
  ),
  def(
    'impulse_variability',
    'regulation',
    'Channel switching between impulsive and withheld responses across contexts.',
    [
      { dimension: 'C', expected: 0.78 },
      { dimension: 'F', expected: 0.42 },
    ]
  ),
  def(
    'calm_under_load',
    'regulation',
    'Stability of control signals when ambiguity and sensory load rise together.',
    [
      { dimension: 'C', expected: 0.72 },
      { dimension: 'S', expected: 0.42 },
    ]
  ),
  def(
    'direct_communication',
    'social',
    'Low-context, explicit exchange versus heavy inference of intent.',
    [
      { dimension: 'R', expected: 0.74 },
      { dimension: 'E', expected: 0.5 },
    ]
  ),
  def(
    'interpersonal_sensitivity',
    'social',
    'Tracking of others’ states and subtle interpersonal cues.',
    [
      { dimension: 'I', expected: 0.78 },
      { dimension: 'E', expected: 0.68 },
    ]
  ),
  def(
    'collaborative_openness',
    'social',
    'Ease of integrating others’ contributions into one’s own working model.',
    [
      { dimension: 'E', expected: 0.72 },
      { dimension: 'A', expected: 0.65 },
    ]
  ),
  def(
    'novelty_seeking',
    'motivation',
    'Drive toward unfamiliar options and exploratory choice.',
    [
      { dimension: 'C', expected: 0.76 },
      { dimension: 'A', expected: 0.8 },
    ]
  ),
  def(
    'curiosity_intensity',
    'motivation',
    'Depth of epistemic engagement once interest is triggered.',
    [
      { dimension: 'A', expected: 0.84 },
      { dimension: 'P', expected: 0.62 },
    ]
  ),
  def(
    'need_for_complexity',
    'motivation',
    'Preference for dense, multi-constraint situations over minimal tasks.',
    [
      { dimension: 'P', expected: 0.72 },
      { dimension: 'C', expected: 0.7 },
    ]
  ),
  def(
    'routine_affinity',
    'motivation',
    'Reward from predictable cadence and repeatable structure.',
    [
      { dimension: 'R', expected: 0.8 },
      { dimension: 'T', expected: 0.65 },
    ]
  ),
  def(
    'precision_drive',
    'motivation',
    'Motivation tied to tightening error bounds and fine correction.',
    [
      { dimension: 'F', expected: 0.8 },
      { dimension: 'T', expected: 0.7 },
    ]
  ),
  def(
    'exploratory_breadth',
    'cognition',
    'Breadth of search across alternatives before committing to a path.',
    [
      { dimension: 'C', expected: 0.74 },
      { dimension: 'A', expected: 0.72 },
    ]
  ),
  def(
    'steady_pacing',
    'regulation',
    'Preference for even tempo and measured pacing under load.',
    [
      { dimension: 'T', expected: 0.78 },
      { dimension: 'R', expected: 0.62 },
    ]
  ),
];

export const TRAIT_DEFINITIONS: readonly TraitDefinition[] = TRAIT_DEFINITION_LIST;

/** Optional faint links between traits that often co-activate in the ontology (not causal claims). */
export const TRAIT_RELATED_PAIRS: readonly [string, string][] = [
  ['pattern_recognition', 'abstract_thinking'],
  ['detail_orientation', 'precision_drive'],
  ['sustained_focus', 'precision_drive'],
  ['associative_thinking', 'metaphorical_thinking'],
  ['novelty_seeking', 'curiosity_intensity'],
  ['sensory_sensitivity', 'interoceptive_awareness'],
  ['emotional_reactivity', 'interpersonal_sensitivity'],
  ['system_thinking', 'linear_inference'],
  ['attention_switching', 'cognitive_breadth'],
  ['direct_communication', 'collaborative_openness'],
];
