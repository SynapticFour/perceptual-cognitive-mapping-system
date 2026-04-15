import type { CognitiveActivation } from '@/core/traits/types';

export type TraitInteraction = Readonly<{
  traits: readonly [string, string];
  effect: 'amplify' | 'suppress';
  /** 0–1 scale; applied with co-activation gate (see `applyTraitInteractions`). */
  strength: number;
}>;

/** Only pairs above this min(weight) participate (soft gate — keep field-like co-activation). */
const CO_ACTIVATION_GATE = 0.05;

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Small, explicit interaction rules (≤10). Co-activation uses `min(w1, w2)` so both
 * traits must be meaningfully active before an edge applies.
 */
export const TRAIT_INTERACTION_RULES: readonly TraitInteraction[] = [
  { traits: ['sustained_focus', 'curiosity_intensity'], effect: 'amplify', strength: 0.12 },
  { traits: ['attention_switching', 'sustained_focus'], effect: 'suppress', strength: 0.16 },
  { traits: ['pattern_recognition', 'system_thinking'], effect: 'amplify', strength: 0.09 },
  { traits: ['emotional_reactivity', 'impulse_variability'], effect: 'amplify', strength: 0.1 },
  { traits: ['novelty_seeking', 'curiosity_intensity'], effect: 'amplify', strength: 0.11 },
  { traits: ['calm_under_load', 'emotional_reactivity'], effect: 'suppress', strength: 0.13 },
  { traits: ['associative_thinking', 'metaphorical_thinking'], effect: 'amplify', strength: 0.09 },
  { traits: ['detail_orientation', 'spatial_holistic'], effect: 'suppress', strength: 0.11 },
] as const;

/**
 * Adjust weights when two traits co-activate. Deterministic, in-place on cloned activations.
 */
export function applyTraitInteractions(activations: readonly CognitiveActivation[]): CognitiveActivation[] {
  const out = activations.map((a) => ({ ...a }));
  const ix = new Map(out.map((a, i) => [a.traitId, i]));

  for (const rule of TRAIT_INTERACTION_RULES) {
    const [idA, idB] = rule.traits;
    const ia = ix.get(idA);
    const ib = ix.get(idB);
    if (ia === undefined || ib === undefined) continue;
    const a = out[ia]!;
    const b = out[ib]!;
    const gate = Math.min(a.weight, b.weight);
    if (gate < CO_ACTIVATION_GATE) continue;
    const k = gate * rule.strength;
    if (rule.effect === 'amplify') {
      const factor = 1 + k;
      a.weight = clamp01(a.weight * factor);
      b.weight = clamp01(b.weight * factor);
    } else {
      const factor = 1 - Math.min(0.55, k * 0.9);
      a.weight = clamp01(a.weight * factor);
      b.weight = clamp01(b.weight * factor);
    }
  }
  return out;
}
