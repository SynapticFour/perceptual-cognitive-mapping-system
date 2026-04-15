import { COGNITIVE_DIMENSION_KEYS, type CognitiveVector } from '@/model/cognitive-dimensions';

/**
 * RESEARCH USE ONLY — NOT FOR USER-FACING PRESENTATION.
 *
 * Archetypes are used internally for similarity matching and synthetic population
 * generation in research contexts. They are NOT presented to users as their "type"
 * or "personality." Doing so would contradict PCMS's dimensional, non-categorical
 * design philosophy.
 *
 * Any UI that shows users an archetype label requires ethics board review.
 */

/**
 * Illustrative reference profiles for "cognitive neighbours" (not empirical norms).
 * Vectors are unit-interval [0, 1] on each routing dimension.
 */
export interface CognitiveArchetype {
  id: string;
  vector: CognitiveVector;
}

function v(partial: Partial<CognitiveVector>): CognitiveVector {
  const base = Object.fromEntries(COGNITIVE_DIMENSION_KEYS.map((d) => [d, 0.5])) as CognitiveVector;
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    if (partial[d] !== undefined) base[d] = partial[d]!;
  }
  return base;
}

export const COGNITIVE_ARCHETYPES: CognitiveArchetype[] = [
  {
    id: 'detective',
    vector: v({ F: 0.88, P: 0.82, S: 0.42, E: 0.45, R: 0.62, C: 0.58, T: 0.7, I: 0.55, A: 0.52, V: 0.48 }),
  },
  {
    id: 'artist',
    vector: v({ F: 0.55, P: 0.62, S: 0.72, E: 0.58, R: 0.4, C: 0.68, T: 0.48, I: 0.65, A: 0.88, V: 0.85 }),
  },
  {
    id: 'engineer',
    vector: v({ F: 0.8, P: 0.72, S: 0.48, E: 0.42, R: 0.88, C: 0.52, T: 0.75, I: 0.5, A: 0.45, V: 0.78 }),
  },
  {
    id: 'healer',
    vector: v({ F: 0.58, P: 0.5, S: 0.62, E: 0.78, R: 0.48, C: 0.72, T: 0.52, I: 0.82, A: 0.55, V: 0.5 }),
  },
];
