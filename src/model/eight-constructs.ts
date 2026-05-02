/**
 * Eight globally oriented behavioral constructs (research-facing labels).
 * Items are authored against these slugs; routing uses {@link eightConstructPrimaryRoutingWeights}.
 *
 * Mapping rationale (opaque F–V axes): each construct has a dominant routing dimension so the
 * existing adaptive engine and confidence model stay valid without a parallel scoring fork.
 */
import type { CognitiveDimension } from '@/model/cognitive-dimensions';

export const EIGHT_CONSTRUCT_IDS = [
  'predictability_adaptivity',
  'sensory_processing',
  'cognitive_framing',
  'social_orientation',
  'information_load',
  'temporal_processing',
  'self_regulation',
  'motivation',
] as const;

export type EightConstructId = (typeof EIGHT_CONSTRUCT_IDS)[number];

export function isEightConstructId(s: string): s is EightConstructId {
  return (EIGHT_CONSTRUCT_IDS as readonly string[]).includes(s);
}

/** Primary routing dimension for each construct (for validation and tooling). */
export const EIGHT_CONSTRUCT_PRIMARY: Record<EightConstructId, CognitiveDimension> = {
  predictability_adaptivity: 'R',
  sensory_processing: 'S',
  cognitive_framing: 'P',
  social_orientation: 'E',
  information_load: 'F',
  temporal_processing: 'T',
  self_regulation: 'C',
  motivation: 'F',
};

/**
 * Pilot routing weights: one dominant axis ≥0.65, small cross-loads for realism.
 * Motivation and information_load both use F — disambiguate in item text and tags.
 */
export function eightConstructPrimaryRoutingWeights(
  construct: EightConstructId,
  variant: 'a' | 'b' | 'c' = 'a'
): Record<CognitiveDimension, number> {
  const z = (keys: Partial<Record<CognitiveDimension, number>>): Record<CognitiveDimension, number> => {
    const out = { F: 0, P: 0, S: 0, E: 0, R: 0, C: 0, T: 0, I: 0, A: 0, V: 0 } as Record<CognitiveDimension, number>;
    for (const [k, v] of Object.entries(keys)) {
      out[k as CognitiveDimension] = v ?? 0;
    }
    return out;
  };

  switch (construct) {
    case 'predictability_adaptivity':
      return z({ R: 0.72, C: 0.18, T: 0.05, S: 0.05 });
    case 'sensory_processing':
      return z({ S: 0.78, F: 0.12, E: 0.1 });
    case 'cognitive_framing':
      if (variant === 'b') return z({ P: 0.68, V: 0.22, C: 0.1 });
      if (variant === 'c') return z({ V: 0.68, P: 0.22, F: 0.1 });
      return z({ P: 0.72, V: 0.15, C: 0.13 });
    case 'social_orientation':
      return z({ E: 0.78, S: 0.12, F: 0.1 });
    case 'information_load':
      if (variant === 'b') return z({ F: 0.7, P: 0.18, C: 0.12 });
      return z({ F: 0.74, P: 0.14, I: 0.12 });
    case 'temporal_processing':
      return z({ T: 0.76, R: 0.14, C: 0.1 });
    case 'self_regulation':
      if (variant === 'b') return z({ C: 0.7, F: 0.18, A: 0.12 });
      return z({ C: 0.72, F: 0.16, R: 0.12 });
    case 'motivation':
      if (variant === 'b') return z({ A: 0.68, F: 0.18, C: 0.14 });
      return z({ F: 0.72, R: 0.14, A: 0.14 });
  }
}

export function eightConstructCategoryTag(construct: EightConstructId): string {
  switch (construct) {
    case 'predictability_adaptivity':
      return 'structure';
    case 'sensory_processing':
      return 'sensory';
    case 'cognitive_framing':
      return 'pattern';
    case 'social_orientation':
      return 'social';
    case 'information_load':
      return 'focus';
    case 'temporal_processing':
      return 'flexibility';
    case 'self_regulation':
      return 'flexibility';
    case 'motivation':
      return 'focus';
  }
}
