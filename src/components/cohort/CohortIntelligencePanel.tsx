'use client';

import { useMemo, useState } from 'react';
import type { CohortModel } from '@/cohort/types';
import type { EnvironmentSignal } from '@/cohort/types';
import type { FrictionSignal } from '@/cohort/types';
import type { PatternMatch } from '@/core/patterns/types';

type Tab = 'map' | 'environment' | 'dynamics';

export interface CohortIntelligencePanelProps {
  cohortModel: CohortModel;
  environmentSignals: EnvironmentSignal[];
  frictionSignals: FrictionSignal[];
  /** Overlap between cohort emphasis and anonymized pattern library (optional). */
  patternMatches?: PatternMatch[] | null;
  /** i18n-ready labels */
  labels: {
    title: string;
    tabMap: string;
    tabEnvironment: string;
    tabDynamics: string;
    diversity: string;
    regionBalance: string;
    dominantTraits: string;
    patternsHeading: string;
    noPatterns: string;
    aggregateOnly: string;
  };
}

/**
 * Aggregate-only cohort UI: three tabs, no individual identification.
 */
export default function CohortIntelligencePanel({
  cohortModel,
  environmentSignals,
  frictionSignals,
  patternMatches,
  labels,
}: CohortIntelligencePanelProps) {
  const [tab, setTab] = useState<Tab>('map');

  const mapSvg = useMemo(() => {
    if (cohortModel.regions.length === 0) {
      return <p className="text-sm text-slate-600">{cohortModel.summaryExplanation}</p>;
    }
    const w = 320;
    const h = 220;
    const pad = 12;
    return (
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        className="max-h-56 rounded border border-slate-200 bg-slate-50"
        role="img"
        aria-label={labels.tabMap}
      >
        {cohortModel.regions.map((r, i) => (
          <circle
            key={r.id}
            cx={pad + r.centroid.x * (w - 2 * pad)}
            cy={pad + (1 - r.centroid.y) * (h - 2 * pad)}
            r={8 + 14 * Math.min(1, r.weight / (cohortModel.regions[0]?.weight || 1))}
            fill={`hsla(${200 + i * 28}, 55%, 78%, 0.55)`}
            stroke="rgba(15,23,42,0.25)"
          />
        ))}
      </svg>
    );
  }, [cohortModel, labels.tabMap]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{labels.title}</h2>
      <p className="mt-1 text-xs text-slate-500">{labels.aggregateOnly}</p>

      <div
        className="mt-3 inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5"
        role="tablist"
      >
        {(
          [
            ['map', labels.tabMap],
            ['environment', labels.tabEnvironment],
            ['dynamics', labels.tabDynamics],
          ] as const
        ).map(([id, text]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium sm:text-sm ${
              tab === id ? 'bg-white text-slate-900 ring-1 ring-slate-300' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {tab === 'map' ? (
        <div className="mt-4 space-y-3">
          {mapSvg}
          <p className="text-sm leading-relaxed text-slate-700">{cohortModel.summaryExplanation}</p>
          <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600 sm:text-sm">
            <div>
              <dt className="font-medium text-slate-800">{labels.diversity}</dt>
              <dd>{cohortModel.diversityIndex.toFixed(3)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">{labels.regionBalance}</dt>
              <dd>{cohortModel.regionBalance.toFixed(3)}</dd>
            </div>
          </dl>
          <div>
            <p className="text-xs font-medium text-slate-800">{labels.dominantTraits}</p>
            <ul className="mt-1 flex flex-wrap gap-1">
              {cohortModel.dominantTraits.slice(0, 10).map((t) => (
                <li
                  key={t.traitId}
                  className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700"
                >
                  {t.traitId} ({(t.share * 100).toFixed(1)}%)
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === 'environment' ? (
        <ul className="mt-4 space-y-3">
          {environmentSignals.map((s) => (
            <li key={s.id} className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm text-slate-800">
              <p>{s.narrative}</p>
              <p className="mt-1 text-xs text-slate-600">{s.explanation}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                intensity {s.intensity.toFixed(2)} · confidence {s.confidence.toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === 'dynamics' ? (
        <div className="mt-4 space-y-4">
          <ul className="space-y-3">
            {frictionSignals.map((f, i) => (
              <li key={i} className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-sm text-slate-800">
                <p className="font-mono text-xs text-slate-600">{f.traits.join(' ↔ ')}</p>
                <p className="mt-1">{f.explanation}</p>
                <p className="mt-1 text-xs text-slate-600">{f.suggestion}</p>
              </li>
            ))}
          </ul>
          {patternMatches && patternMatches.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-slate-800">{labels.patternsHeading}</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                {patternMatches.map((m, i) => (
                  <li key={i}>
                    {m.pattern.traits.join(', ')} — score {m.score.toFixed(2)} (support {m.pattern.support})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-slate-500">{labels.noPatterns}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
