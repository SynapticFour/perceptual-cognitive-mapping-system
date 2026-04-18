import { cohortTraitShares } from '@/cohort/environment-signals';
import type { CohortModel, FrictionSignal } from '@/cohort/types';

/** Pairs of constructs that may pull group norms in different directions (descriptive, non-clinical). */
export const DEFAULT_FRICTION_PAIRS: readonly (readonly [string, string])[] = [
  ['direct_communication', 'interpersonal_sensitivity'],
  ['novelty_seeking', 'routine_affinity'],
  ['attention_switching', 'sustained_focus'],
] as const;

function traitMassInRegion(traitId: string, region: CohortModel['regions'][0]): number {
  return region.traitDistribution[traitId] ?? 0;
}

/**
 * Detect when two constructs are both salient but concentrated differently across regions —
 * aggregate tension in communication / pacing expectations (not interpersonal blame).
 */
export function mapInteractionFriction(
  model: CohortModel,
  pairs: readonly (readonly [string, string])[] = DEFAULT_FRICTION_PAIRS
): FrictionSignal[] {
  const out: FrictionSignal[] = [];
  if (model.regions.length < 2) return out;

  const shares = cohortTraitShares(model);

  for (const [a, b] of pairs) {
    let bestA = -1;
    let bestAr = 0;
    let bestB = -1;
    let bestBr = 0;
    for (let ri = 0; ri < model.regions.length; ri++) {
      const r = model.regions[ri]!;
      const va = traitMassInRegion(a, r);
      const vb = traitMassInRegion(b, r);
      if (va > bestA) {
        bestA = va;
        bestAr = ri;
      }
      if (vb > bestB) {
        bestB = vb;
        bestBr = ri;
      }
    }

    const globalA = shares.get(a) ?? 0;
    const globalB = shares.get(b) ?? 0;
    const salient = globalA > 0.04 && globalB > 0.04;
    const split = bestAr !== bestBr && bestA > 0.12 && bestB > 0.12;

    if (!(salient && split)) continue;

    const strength = Math.min(1, Math.sqrt(bestA * bestB) * (globalA + globalB));

    out.push({
      traits: [a, b],
      strength,
      explanation:
        'Different interaction styles appear strongly represented in separate aggregate regions, which may create friction in shared communication or pacing expectations.',
      suggestion:
        'Team agreements that make norms explicit (channels, interruption rules, depth vs breadth of exploration) tend to help without singling anyone out.',
    });
  }

  return out.sort((x, y) => y.strength - x.strength);
}
