import { cohortTraitShares } from '@/cohort/environment-signals';
import type { CohortModel, FrictionSignal } from '@/cohort/types';

/**
 * Scenarios: same trait pair with tailored aggregate copy (not interpersonal blame).
 * Order within `pair` is not significant for detection (symmetric check below).
 */
export const FRICTION_SCENARIOS: readonly {
  pair: readonly [string, string];
  explanation: string;
  suggestion: string;
}[] = [
  {
    pair: ['direct_communication', 'interpersonal_sensitivity'],
    explanation:
      'At the aggregate level, explicit low-context communication and attunement to interpersonal nuance are both salient, yet they may pull toward different meeting norms. This describes diverse styles in the field, not disagreements between named people.',
    suggestion:
      'Shared agreements on how direct to be, when to check in, and how to signal intent can make expectations easier to navigate for everyone.',
  },
  {
    pair: ['novelty_seeking', 'routine_affinity'],
    explanation:
      'Exploratory and stability-seeking constructs are both well represented, which can shape how the group wants to sequence work and how much change feels comfortable in a day.',
    suggestion:
      'Rhythms that include both predictable anchors and opt-in exploration windows can reduce pull in opposite directions.',
  },
  {
    pair: ['attention_switching', 'sustained_focus'],
    explanation:
      'Fast reallocation of attention and maintenance of a narrow focus channel are both strong; scheduling that mixes rapid handoffs with protected deep-work blocks can otherwise feel at odds at the group level.',
    suggestion:
      'Timeboxing “switching” phases next to “single-thread” blocks—and naming them in the schedule—tends to align expectations without singling anyone out.',
  },
  {
    pair: ['exploratory_breadth', 'linear_inference'],
    explanation:
      'Broad search across options and stepwise, ordered reasoning are both present in the map; that can show up as different comfort with open-ended ideation versus tightly sequenced plans.',
    suggestion:
      'Offering both a clear default path and an optional “exploratory” lane in shared materials can satisfy both without forcing one mode on the whole group.',
  },
  {
    pair: ['detail_orientation', 'associative_thinking'],
    explanation:
      'Emphasis on local, concrete features and on wide, cross-linked idea networks may coexist; teams sometimes split between “nail the spec” and “map the big picture” unless norms make room for both.',
    suggestion:
      'Explicit handoffs between detail passes and associational brainstorming—plus a shared object (doc, board)—keep both modes legitimate.',
  },
  {
    pair: ['verbal_semantic', 'spatial_holistic'],
    explanation:
      'Language-heavy symbolic structure and spatial, gestalt-like representations are both salient in the aggregate; mixed channels (written briefs plus diagrams) may otherwise feel mismatched.',
    suggestion:
      'Parallel channels—short written takeaways and visual scaffolds—reduce friction when the group’s cognitive styles differ in how they like information packaged.',
  },
  {
    pair: ['curiosity_intensity', 'delay_gratification'],
    explanation:
      'High epistemic depth on interesting threads and a preference to defer output for long-horizon structure can both be strong, which can pull between “go deep now” and “hold the line for a later pay-off.”',
    suggestion:
      'Milestones that name both exploration time and commit points help align pacing without labelling people.',
  },
] as const;

/** @deprecated use {@link FRICTION_SCENARIOS} for copy; this list is the pairs only. */
export const DEFAULT_FRICTION_PAIRS: readonly (readonly [string, string])[] = FRICTION_SCENARIOS.map(
  (s) => s.pair
) as readonly (readonly [string, string])[];

function traitMassInRegion(traitId: string, region: CohortModel['regions'][0]): number {
  return region.traitDistribution[traitId] ?? 0;
}

function findScenario(
  a: string,
  b: string
): (typeof FRICTION_SCENARIOS)[number] | undefined {
  for (const s of FRICTION_SCENARIOS) {
    const [x, y] = s.pair;
    if ((a === x && b === y) || (a === y && b === x)) return s;
  }
  return undefined;
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
    const scenario = findScenario(a, b);
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
      explanation: scenario?.explanation ?? FRICTION_DEFAULT_EXPLANATION,
      suggestion: scenario?.suggestion ?? FRICTION_DEFAULT_SUGGESTION,
    });
  }

  return out.sort((x, y) => y.strength - x.strength);
}

const FRICTION_DEFAULT_EXPLANATION =
  'Different styles are strongly represented in the map. At the aggregate level, these constructs concentrate in different areas—diverse norms, not conflict between named individuals.';

const FRICTION_DEFAULT_SUGGESTION =
  'Shared agreements that make norms explicit (channels, timing, depth vs breadth) tend to help without singling anyone out.';
