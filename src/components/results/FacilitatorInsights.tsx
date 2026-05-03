'use client';

import { useMemo } from 'react';

import type { CognitiveProfilePublic } from '@/types/profile-public';
import { useUiStrings } from '@/lib/use-ui-strings';

const CORE_DIMS = ['F', 'P', 'S', 'E', 'R', 'C'] as const;

export type FacilitatorCoreDimension = (typeof CORE_DIMS)[number];

export type FacilitatorDimensionScores = Record<FacilitatorCoreDimension, number>;

type EdgeBand = 'high' | 'low';

type CardPick =
  | { kind: 'dimension'; dim: FacilitatorCoreDimension; band: EdgeBand }
  | { kind: 'filler'; slot: 1 | 2 };

const HIGH_EDGE = 70;
const LOW_EDGE = 30;

/** Picks 2–4 facilitator cards: strongest F–C edges (≥70 or ≤30), padded with neutral fillers if needed. */
export function selectFacilitatorCards(scores: FacilitatorDimensionScores): CardPick[] {
  const edges: { dim: FacilitatorCoreDimension; band: EdgeBand; extremity: number }[] = [];
  for (const dim of CORE_DIMS) {
    const p = scores[dim];
    if (p >= HIGH_EDGE) edges.push({ dim, band: 'high', extremity: Math.abs(p - 50) });
    else if (p <= LOW_EDGE) edges.push({ dim, band: 'low', extremity: Math.abs(p - 50) });
  }
  edges.sort((a, b) => b.extremity - a.extremity);
  const dimensionPicks: CardPick[] = edges.slice(0, 4).map(({ dim, band }) => ({ kind: 'dimension', dim, band }));

  if (dimensionPicks.length >= 2) return dimensionPicks;
  if (dimensionPicks.length === 1) return [...dimensionPicks, { kind: 'filler', slot: 1 }];
  return [
    { kind: 'filler', slot: 1 },
    { kind: 'filler', slot: 2 },
  ];
}

export type FacilitatorInsightsProps = {
  profile: CognitiveProfilePublic;
  locale: string;
  /** Raw 0–100 routing scores (F–C), same scale as the results dimension bars. */
  dimensionScores: FacilitatorDimensionScores;
  showFacilitatorView?: boolean;
};

export default function FacilitatorInsights({
  profile,
  locale,
  dimensionScores,
  showFacilitatorView = false,
}: FacilitatorInsightsProps) {
  const ui = useUiStrings();

  const picks = useMemo(() => selectFacilitatorCards(dimensionScores), [dimensionScores]);

  if (!showFacilitatorView) return null;

  const lowSessionConfidence = profile.confidence < 0.38;

  return (
    <section
      className="mb-8 rounded-xl border border-teal-200 bg-teal-50/60 p-4 shadow-sm sm:p-6"
      aria-labelledby="facilitator-insights-heading"
      lang={locale}
    >
      <h2 id="facilitator-insights-heading" className="text-lg font-semibold text-teal-950">
        {ui['facilitator.section_title']}
      </h2>
      <p className="mt-1 text-sm text-teal-900/90">{ui['facilitator.section_intro']}</p>
      <p className="mt-4 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-950">
        {ui['facilitator.disclaimer']}
      </p>
      {lowSessionConfidence ? (
        <p className="mt-3 text-sm text-teal-900/85" role="note">
          {ui['facilitator.low_confidence_note']}
        </p>
      ) : null}

      <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2">
        {picks.map((pick, i) => {
          if (pick.kind === 'filler') {
            const prefix = pick.slot === 1 ? 'facilitator.filler1' : 'facilitator.filler2';
            return (
              <li
                key={`filler-${pick.slot}-${i}`}
                className="rounded-lg border border-teal-100 bg-white p-4 shadow-sm ring-1 ring-teal-900/5"
              >
                <h3 className="text-sm font-semibold text-slate-900">{ui['facilitator.label_observation']}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-800">{ui[`${prefix}.observation`]}</p>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{ui['facilitator.label_suggestions']}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-800">{ui[`${prefix}.suggestion`]}</p>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{ui['facilitator.label_professional']}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{ui[`${prefix}.professional`]}</p>
              </li>
            );
          }

          const dimLabel = ui[`dims.${pick.dim}.short_label`];
          const base = `facilitator.${pick.dim}.${pick.band}`;
          return (
            <li
              key={`${pick.dim}-${pick.band}-${i}`}
              className="rounded-lg border border-teal-100 bg-white p-4 shadow-sm ring-1 ring-teal-900/5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-teal-800">{dimLabel}</p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">{ui['facilitator.label_observation']}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">{ui[`${base}.observation`]}</p>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{ui['facilitator.label_suggestions']}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">{ui[`${base}.suggestion`]}</p>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{ui['facilitator.label_professional']}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{ui[`${base}.professional`]}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
