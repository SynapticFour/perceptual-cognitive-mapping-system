import { describe, expect, it } from 'vitest';
import type { CognitiveActivation } from '@/core/traits/types';
import { applyTraitInteractions } from '@/core/traits/trait-interactions';

function act(id: string, w: number): CognitiveActivation {
  return {
    traitId: id,
    domain: 'cognition',
    vector: [],
    weight: w,
  };
}

describe('applyTraitInteractions', () => {
  it('amplifies co-activated sustained_focus and curiosity_intensity', () => {
    const base = [act('sustained_focus', 0.42), act('curiosity_intensity', 0.41), act('routine_affinity', 0.2)];
    const out = applyTraitInteractions(base);
    const f = out.find((a) => a.traitId === 'sustained_focus')!.weight;
    const c = out.find((a) => a.traitId === 'curiosity_intensity')!.weight;
    expect(f).toBeGreaterThan(0.42);
    expect(c).toBeGreaterThan(0.41);
    expect(out.find((a) => a.traitId === 'routine_affinity')!.weight).toBe(0.2);
  });

  it('suppresses co-activated attention_switching and sustained_focus', () => {
    const base = [act('attention_switching', 0.45), act('sustained_focus', 0.44), act('routine_affinity', 0.35)];
    const out = applyTraitInteractions(base);
    expect(out.find((a) => a.traitId === 'attention_switching')!.weight).toBeLessThan(0.45);
    expect(out.find((a) => a.traitId === 'sustained_focus')!.weight).toBeLessThan(0.44);
  });
});
