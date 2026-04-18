import type { CohortModel, EnvironmentSignal, FrictionSignal } from '@/cohort/types';
import { formatTraitDomainLabel } from '@/core/traits/trait-domains';
import { sanitizeGuidanceText } from '@/cohort/ux-copy-safety';
import {
  MAX_GUIDANCE_INSIGHTS,
  type GuidanceInsight,
  type GuidanceRecommendation,
  type InteractionDynamicsItem,
  type InsightConfidenceBand,
} from '@/cohort/ux-types';

export function numericToConfidenceBand(score01: number): InsightConfidenceBand {
  if (score01 >= 0.66) return 'high';
  if (score01 >= 0.38) return 'medium';
  return 'low';
}

function regionDescription(region: CohortModel['regions'][0], totalWeight: number): string {
  const domain = formatTraitDomainLabel(region.primaryDomain);
  const pct = totalWeight > 0 ? Math.round((region.weight / totalWeight) * 100) : 0;
  return sanitizeGuidanceText(
    `This area of the shared map emphasizes ${domain}-related patterns. Roughly ${pct}% of the visible regional weight sits here.`
  );
}

/** Labels for aggregate map tooltips (no individual identifiers). */
export function describeCohortRegionForTooltip(
  region: CohortModel['regions'][0],
  totalWeight: number
): { description: string; relativeSizeLabel: string } {
  const pct = totalWeight > 0 ? Math.round((region.weight / totalWeight) * 100) : 0;
  return {
    description: regionDescription(region, totalWeight),
    relativeSizeLabel: sanitizeGuidanceText(`About ${pct}% of regional weight in this view`),
  };
}

const REC_TITLE: Record<string, string> = {
  sensory_load: 'Consider steadier sensory conditions',
  interruption_load: 'Consider clearer boundaries around interruptions',
  uninterrupted_blocks: 'Consider protecting focus blocks',
  group_interaction_load: 'Consider explicit communication norms',
  structure_predictability: 'Consider visible structure and sequencing',
};

function recommendationFromSignal(s: EnvironmentSignal): GuidanceRecommendation {
  const title = sanitizeGuidanceText(REC_TITLE[s.id] ?? 'Environmental adjustment to consider');
  const description = sanitizeGuidanceText(
    s.narrative.replace(/^This environment may benefit from/i, 'This group might benefit from').trim()
  );
  const rationale = sanitizeGuidanceText(s.explanation);
  return {
    title,
    description,
    rationale,
    confidence: numericToConfidenceBand(s.confidence),
  };
}

export function buildGuidanceRecommendations(signals: EnvironmentSignal[]): GuidanceRecommendation[] {
  return signals.map(recommendationFromSignal);
}

function frictionHeadlineAndBody(f: FrictionSignal): { headline: string; expanded: string } {
  const [a, b] = f.traits;
  const hay = `${a} ${b}`.toLowerCase();
  if (hay.includes('direct_communication') || hay.includes('interpersonal') || hay.includes('collaborative')) {
    return {
      headline: sanitizeGuidanceText('Different communication preferences are present'),
      expanded: sanitizeGuidanceText(
        'Some individuals may prefer direct communication, while others may value more contextual or emotionally aware interactions. This is a difference in style, not a problem to fix.'
      ),
    };
  }
  if (hay.includes('sensory') || hay.includes('environmental')) {
    return {
      headline: sanitizeGuidanceText('Different sensitivities to surroundings may show up together'),
      expanded: sanitizeGuidanceText(
        `${f.explanation} ${f.suggestion}`.trim()
      ),
    };
  }
  return {
    headline: sanitizeGuidanceText('Different priorities may appear side by side'),
    expanded: sanitizeGuidanceText(`${f.explanation} ${f.suggestion}`.trim()),
  };
}

export function buildInteractionDynamics(friction: FrictionSignal[]): InteractionDynamicsItem[] {
  return friction.map((f) => {
    const { headline, expanded } = frictionHeadlineAndBody(f);
    return {
      headline,
      expanded,
      confidence: numericToConfidenceBand(f.strength),
    };
  });
}

/**
 * 3–5 plain-language insights; capped at {@link MAX_GUIDANCE_INSIGHTS}.
 * Avoids trait identifiers in titles; contributors stay high-level.
 */
export function buildGuidanceInsights(
  cohort: CohortModel,
  environmentSignals: EnvironmentSignal[],
  frictionSignals: FrictionSignal[]
): GuidanceInsight[] {
  const out: GuidanceInsight[] = [];

  if (cohort.regions.length >= 2) {
    out.push({
      id: 'multi-style',
      title: sanitizeGuidanceText('Multiple styles of engagement appear together'),
      explanation: sanitizeGuidanceText(
        'The shared map shows more than one concentration area. That usually means varied strengths and habits within the group—not a single “right” way to participate.'
      ),
      confidence: numericToConfidenceBand(cohort.regionBalance),
      whyContributors: [
        'Regional structure in the pooled map',
        `Balance across regions (summary index: ${cohort.regionBalance.toFixed(2)})`,
      ],
    });
  }

  if (cohort.diversityIndex > 0.12) {
    out.push({
      id: 'construct-mix',
      title: sanitizeGuidanceText('A wide mix of emphasis across areas'),
      explanation: sanitizeGuidanceText(
        'Construct weight is spread across several areas rather than hugging one theme. Facilitators may want flexible formats rather than a single pace or modality.'
      ),
      confidence: numericToConfidenceBand(Math.min(1, cohort.diversityIndex * 4)),
      whyContributors: ['Pooled construct mass variance (diversity index)', 'Aggregate activation mix'],
    });
  }

  const topSensory = environmentSignals.find((e) => e.id === 'sensory_load');
  if (topSensory && topSensory.intensity > 0.35) {
    out.push({
      id: 'env-variability',
      title: sanitizeGuidanceText('Elevated attention to environmental change'),
      explanation: sanitizeGuidanceText(
        'Signals suggest this group may feel environmental shifts more strongly. Small, predictable changes often land more safely than abrupt swings.'
      ),
      confidence: numericToConfidenceBand(topSensory.confidence * topSensory.intensity),
      whyContributors: ['Group-level environment signal (sensory load)', 'Pooled construct emphasis'],
    });
  }

  if (frictionSignals.length > 0) {
    out.push({
      id: 'interaction-differences',
      title: sanitizeGuidanceText('Different interaction preferences may coexist'),
      explanation: sanitizeGuidanceText(
        'Where priorities differ, friction is often about fit—not fault. Naming norms and offering options usually works better than pushing one style.'
      ),
      confidence: numericToConfidenceBand(
        frictionSignals.reduce((m, f) => Math.max(m, f.strength), 0)
      ),
      whyContributors: ['Aggregate pairwise contrast patterns (non-identifying)'],
    });
  }

  if (cohort.spreadMetrics.spanX + cohort.spreadMetrics.spanY > 0.85) {
    out.push({
      id: 'spatial-spread',
      title: sanitizeGuidanceText('The group occupies a broad stretch of the map'),
      explanation: sanitizeGuidanceText(
        'Spread is wide in the shared view, so one-size schedules or room setups may not fit everyone equally. Modular choices help.'
      ),
      confidence: 'medium',
      whyContributors: ['Pooled coordinate spread metrics'],
    });
  }

  if (out.length === 0) {
    out.push({
      id: 'baseline',
      title: sanitizeGuidanceText('Patterns are mild or still forming'),
      explanation: sanitizeGuidanceText(
        'There may not be strong group-level contrasts yet. Insights work best with more aggregate input and stable participation over time.'
      ),
      confidence: 'low',
      whyContributors: ['Sample size and pooled signal strength'],
    });
  }

  return out.slice(0, MAX_GUIDANCE_INSIGHTS);
}
