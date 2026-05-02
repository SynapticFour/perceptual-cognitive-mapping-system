'use client';

import type { EightConstructOutcome } from '@/types/eight-construct-outcome';
import { EIGHT_CONSTRUCT_IDS } from '@/model/eight-constructs';
import type { UiStrings } from '@/lib/ui-strings';

type Props = {
  outcome: EightConstructOutcome;
  strings: UiStrings;
};

export default function EightConstructSummary({ outcome, strings: ui }: Props) {
  const p = (key: string) => ui[key] ?? key;

  return (
    <section
      className="mb-8 rounded-xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white p-4 shadow-sm sm:p-6"
      aria-labelledby="eight-construct-heading"
    >
      <h2 id="eight-construct-heading" className="text-lg font-semibold text-slate-900">
        {p('results.eight_constructs.heading')}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{p('results.eight_constructs.intro')}</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <th className="py-2 pr-2">{p('results.eight_constructs.col_construct')}</th>
              <th className="py-2 pr-2">{p('results.eight_constructs.col_score')}</th>
              <th className="py-2 pr-2">{p('results.eight_constructs.col_n')}</th>
              <th className="hidden py-2 pr-2 sm:table-cell">{p('results.eight_constructs.col_spread')}</th>
              <th className="hidden py-2 md:table-cell">{p('results.eight_constructs.col_sem')}</th>
            </tr>
          </thead>
          <tbody>
            {EIGHT_CONSTRUCT_IDS.map((id) => {
              const row = outcome.scales[id];
              const labelKey = `results.eight_constructs.c_${id}`;
              const pct =
                row.mean01 !== null && row.mean01 !== undefined ? Math.round(row.mean01 * 100) : null;
              return (
                <tr key={id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 font-medium text-slate-900">{p(labelKey)}</td>
                  <td className="py-2 pr-2">
                    {pct !== null ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-24 max-w-[40vw] overflow-hidden rounded-full bg-slate-200"
                          role="presentation"
                        >
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-slate-800">{pct}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">{p('results.eight_constructs.na')}</span>
                    )}
                  </td>
                  <td className="py-2 pr-2 tabular-nums text-slate-700">{row.nItems}</td>
                  <td className="hidden py-2 pr-2 tabular-nums text-slate-600 sm:table-cell">
                    {row.withinPersonItemSd !== null ? row.withinPersonItemSd.toFixed(3) : p('results.eight_constructs.na')}
                  </td>
                  <td className="hidden py-2 tabular-nums text-slate-600 md:table-cell">
                    {row.meanSemWithinPerson !== null ? row.meanSemWithinPerson.toFixed(3) : p('results.eight_constructs.na')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-600">{p('results.eight_constructs.foot_note')}</p>
    </section>
  );
}
