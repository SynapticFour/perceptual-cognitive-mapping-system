'use client';

import { useMemo } from 'react';
import type { CohortModel, EnvironmentSignal, FrictionSignal } from '@/cohort/types';
import type { PatternMatch } from '@/core/patterns/types';
import {
  buildGuidanceInsights,
  buildGuidanceRecommendations,
  buildInteractionDynamics,
} from '@/cohort/ux-insights';
import { sanitizeGuidanceText } from '@/cohort/ux-copy-safety';
import type { UiStrings } from '@/lib/ui-strings';
import CohortCognitiveLandscapeRegions from '@/components/cohort/CohortCognitiveLandscapeRegions';
import InsightConfidenceBadge from '@/components/cohort/InsightConfidenceBadge';

export interface CohortInsightsDashboardProps {
  cohortModel: CohortModel;
  environmentSignals: EnvironmentSignal[];
  frictionSignals: FrictionSignal[];
  patternMatches?: PatternMatch[] | null;
  strings: UiStrings;
}

export default function CohortInsightsDashboard({
  cohortModel,
  environmentSignals,
  frictionSignals,
  patternMatches,
  strings,
}: CohortInsightsDashboardProps) {
  const insights = useMemo(
    () => buildGuidanceInsights(cohortModel, environmentSignals, frictionSignals),
    [cohortModel, environmentSignals, frictionSignals]
  );
  const recommendations = useMemo(
    () => buildGuidanceRecommendations(environmentSignals),
    [environmentSignals]
  );
  const dynamics = useMemo(() => buildInteractionDynamics(frictionSignals), [frictionSignals]);

  const uncertainty = strings['cohortInsights.confidence_tooltip'];
  const envLead = strings['cohortInsights.env_optional_lead'];

  return (
    <div className="space-y-10">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">{strings['cohortInsights.page_title']}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{strings['cohortInsights.page_intro']}</p>
        <p className="mt-2 text-xs text-slate-500">{strings['cohortInsights.aggregate_only']}</p>
      </header>

      <section aria-labelledby="cohort-landscape-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="cohort-landscape-heading" className="text-lg font-semibold text-slate-900">
          {strings['cohortInsights.section_landscape']}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{strings['cohortInsights.landscape_hint']}</p>
        <div className="mt-4">
          <CohortCognitiveLandscapeRegions
            cohortModel={cohortModel}
            ariaLabel={strings['cohortInsights.landscape_aria']}
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{sanitizeGuidanceText(cohortModel.summaryExplanation)}</p>
      </section>

      <section aria-labelledby="cohort-key-insights-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="cohort-key-insights-heading" className="text-lg font-semibold text-slate-900">
          {strings['cohortInsights.section_insights']}
        </h2>
        <ul className="mt-4 space-y-4">
          {insights.map((ins) => (
            <li key={ins.id} className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base font-medium text-slate-900">{ins.title}</h3>
                <InsightConfidenceBadge band={ins.confidence} strings={strings} uncertaintyTooltip={uncertainty} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{ins.explanation}</p>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium text-indigo-700 hover:underline">
                  {strings['cohortInsights.why_seeing']}
                </summary>
                <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
                  {ins.whyContributors.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cohort-env-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="cohort-env-heading" className="text-lg font-semibold text-slate-900">
          {strings['cohortInsights.section_environment']}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{envLead}</p>
        <ul className="mt-4 space-y-4">
          {recommendations.map((rec, i) => (
            <li
              key={`${rec.title}-${i}`}
              className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base font-medium text-slate-900">{rec.title}</h3>
                <InsightConfidenceBadge band={rec.confidence} strings={strings} uncertaintyTooltip={uncertainty} />
              </div>
              <p className="mt-2 text-sm text-slate-800">{rec.description}</p>
              <p className="mt-2 text-xs text-slate-600">
                <span className="font-medium text-slate-700">{strings['cohortInsights.rationale_label']}</span> {rec.rationale}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cohort-dynamics-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="cohort-dynamics-heading" className="text-lg font-semibold text-slate-900">
          {strings['cohortInsights.section_dynamics']}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{strings['cohortInsights.dynamics_lead']}</p>
        <ul className="mt-4 space-y-4">
          {dynamics.map((d, i) => (
            <li key={i} className="rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base font-medium text-slate-900">{d.headline}</h3>
                <InsightConfidenceBadge band={d.confidence} strings={strings} uncertaintyTooltip={uncertainty} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{d.expanded}</p>
            </li>
          ))}
        </ul>
        {patternMatches && patternMatches.length > 0 ? (
          <div className="mt-6 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <p className="font-medium text-slate-800">{strings['cohortInsights.pattern_library_note']}</p>
            <p className="mt-1">{strings['cohortInsights.pattern_library_body']}</p>
          </div>
        ) : null}
      </section>

      <footer className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <p>{strings['cohortInsights.footer_uncertainty']}</p>
      </footer>
    </div>
  );
}
