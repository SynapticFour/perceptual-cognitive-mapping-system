'use client';

import { useTranslations } from 'next-intl';
import { ROUTING_WEIGHT_KEYS, type RoutingWeightKey } from '@/adaptive/routing-tags';
import type { TagCoverageVector } from '@/adaptive/coverage-model';
import { getDimensionUi } from '@/lib/cognitive-dimensions-ui';
import type { UiStrings } from '@/lib/ui-strings';

const GOAL = 0.75;

export interface LiveRefinementConfidenceProps {
  tagCoverage: TagCoverageVector;
  /** When set, only these rows are shown; otherwise all six. */
  highlightDimensions?: readonly RoutingWeightKey[] | null;
  strings: UiStrings;
  heading?: string;
}

export default function LiveRefinementConfidence({
  tagCoverage,
  highlightDimensions,
  strings,
  heading,
}: LiveRefinementConfidenceProps) {
  const t = useTranslations('questionnaire');
  const dims =
    highlightDimensions && highlightDimensions.length > 0
      ? highlightDimensions
      : [...ROUTING_WEIGHT_KEYS];

  return (
    <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50/80 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-900">
        {heading ?? strings['questionnaire.refinement_live_heading']}
      </p>
      <ul className="space-y-2">
        {dims.map((dim) => {
          const meta = getDimensionUi(dim, strings);
          const v = tagCoverage[dim];
          const pct = Math.round(v * 100);
          const goalPct = GOAL * 100;
          return (
            <li key={dim} className="flex flex-col gap-0.5">
              <div className="flex justify-between text-xs text-slate-800">
                <span className="font-medium">{meta.shortLabel}</span>
                <span className="tabular-nums text-slate-600">
                  {t('refinement_live_row', { pct, goal: Math.round(goalPct) })}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, (v / GOAL) * 100)}%` }}
                />
                <div
                  className="pointer-events-none absolute inset-y-0 w-px bg-amber-500"
                  style={{ left: `${goalPct}%` }}
                  title="0.75 goal"
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
