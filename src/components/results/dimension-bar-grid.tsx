'use client';

import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { getDimensionUi } from '@/lib/cognitive-dimensions-ui';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import type { ConfidenceComponents } from '@/scoring';
import { confidenceFillClass } from '@/lib/results-colors';
import type { UiStrings } from '@/lib/ui-strings';
import { formatUiString } from '@/lib/ui-strings';

export interface DimensionBarGridProps {
  confidenceComponents: ConfidenceComponents;
  display: DimensionDisplayModel;
  strings: UiStrings;
}

function plausibleUpper(score01: number, confidence: number): number {
  return score01 + (1 - confidence) * 0.5 * (1 - score01);
}

export default function DimensionBarGrid({ confidenceComponents, display, strings }: DimensionBarGridProps) {
  return (
    <section
      className="w-full max-w-full min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
      aria-label={strings['bars.aria']}
    >
      <p className="mb-3 text-sm text-slate-700">{strings['bars.caption']}</p>
      <ul className="grid grid-cols-1 gap-4">
        {ROUTING_WEIGHT_KEYS.map((dim) => {
          const meta = getDimensionUi(dim, strings);
          const raw = display.rawPercent[dim] / 100;
          const conf = confidenceComponents[dim].finalConfidence;
          const upper = plausibleUpper(raw, conf);
          const rawPct = display.rawPercent[dim];
          const upperPct = Math.min(100, upper * 100);
          const ghostWidth = Math.max(0, upperPct - rawPct);
          const items = display.itemsContributing[dim];

          return (
            <li
              key={dim}
              className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 shadow-inner"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{meta.title}</h3>
                <span className="text-sm font-semibold text-slate-800 tabular-nums">{rawPct.toFixed(0)}%</span>
              </div>
              <div
                className="relative mt-2 h-9 w-full overflow-hidden rounded-md bg-slate-200"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(rawPct)}
                aria-label={formatUiString(strings['bars.progressbar_aria'], {
                  title: meta.title,
                  raw: rawPct.toFixed(0),
                  upper: upperPct.toFixed(0),
                })}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-blue-700"
                  style={{ width: `${rawPct}%` }}
                  aria-hidden
                />
                {ghostWidth > 0.5 ? (
                  <div
                    className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,#cbd5e1_0px,#cbd5e1_5px,#e2e8f0_5px,#e2e8f0_10px)]"
                    style={{ left: `${rawPct}%`, width: `${ghostWidth}%` }}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-slate-600">
                <span>{meta.lowLabel}</span>
                <span>{meta.highLabel}</span>
              </div>
              <div className="mt-2 flex flex-col gap-1 text-xs text-slate-700">
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${confidenceFillClass(conf)}`}
                >
                  {formatUiString(strings['bars.confidence_line'], {
                    pct: Math.round(conf * 100),
                    n: items,
                  })}
                </span>
                <span className="text-slate-500">{strings['bars.tail_explainer']}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
