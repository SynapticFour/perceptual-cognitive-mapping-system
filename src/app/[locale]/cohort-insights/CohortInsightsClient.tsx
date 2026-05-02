'use client';

import { useMemo } from 'react';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { buildCognitiveModel } from '@/core/cognitive-pipeline';
import { buildCohortCognitiveMap } from '@/cohort/cohort-cognitive-map';
import { deriveEnvironmentSignals } from '@/cohort/environment-signals';
import { mapInteractionFriction } from '@/cohort/interaction-friction';
import { matchCohortToKnownPatterns } from '@/cohort/pattern-cohort-match';
import { getTopPatterns } from '@/core/patterns/pattern-store';
import CohortInsightsDashboard from '@/components/cohort/CohortInsightsDashboard';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import { useUiStrings } from '@/lib/use-ui-strings';
import type { ConfidenceComponents } from '@/scoring';

const mockDisplay: DimensionDisplayModel = {
  rawPercent: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 50])) as DimensionDisplayModel['rawPercent'],
  weightedPercent: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 50])) as DimensionDisplayModel['weightedPercent'],
  itemsContributing: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 0])) as DimensionDisplayModel['itemsContributing'],
};

const mockConfidence: ConfidenceComponents = Object.fromEntries(
  ROUTING_WEIGHT_KEYS.map((d) => [
    d,
    {
      effectiveEvidence: 1,
      reliability: 1,
      consistency: 1,
      finalConfidence: 0.8,
      meetsMinimumSample: true,
    },
  ])
) as ConfidenceComponents;

function makeDemoModel(seed: number) {
  return buildCognitiveModel({
    embeddingVector: new Array(32).fill(0).map((_, i) => (((i + seed) % 10) + Math.sin(seed)) / 12),
    embeddingDimension: 32,
    display: mockDisplay,
    confidenceComponents: mockConfidence,
    syntheticCount: 64,
  });
}

/** Demo aggregate view for facilitators — replace with server-fed cohort models in production. */
export default function CohortInsightsClient() {
  const ui = useUiStrings();

  const { cohortModel, environmentSignals, frictionSignals, patternMatches } = useMemo(() => {
    const models = [1, 2, 3].map((seed) => makeDemoModel(seed));
    const cm = buildCohortCognitiveMap(models);
    const env = deriveEnvironmentSignals(cm);
    const friction = mapInteractionFriction(cm);
    const patterns = matchCohortToKnownPatterns(cm, getTopPatterns(48), 8);
    return { cohortModel: cm, environmentSignals: env, frictionSignals: friction, patternMatches: patterns };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40">
      <main className="container mx-auto max-w-4xl px-3 py-8 sm:px-4">
        <CohortInsightsDashboard
          cohortModel={cohortModel}
          environmentSignals={environmentSignals}
          frictionSignals={frictionSignals}
          patternMatches={patternMatches}
          strings={ui}
        />
      </main>
    </div>
  );
}
