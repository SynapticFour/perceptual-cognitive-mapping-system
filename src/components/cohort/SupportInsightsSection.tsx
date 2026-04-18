'use client';

import type { EarlySupportSignal } from '@/cohort/types';
import { MAX_EARLY_SUPPORT_SIGNALS_UI } from '@/cohort/ux-types';
import { sanitizeGuidanceText } from '@/cohort/ux-copy-safety';
import InsightConfidenceBadge from '@/components/cohort/InsightConfidenceBadge';
import type { UiStrings } from '@/lib/ui-strings';

export interface SupportInsightsSectionProps {
  signals: EarlySupportSignal[];
  strings: UiStrings;
}

/**
 * Private, individual-facing support hints — never render in cohort views.
 */
export default function SupportInsightsSection({ signals, strings }: SupportInsightsSectionProps) {
  const slice = signals.slice(0, MAX_EARLY_SUPPORT_SIGNALS_UI);
  if (slice.length === 0) return null;

  const uncertainty = strings['cohortInsights.confidence_tooltip'];

  return (
    <section
      className="mb-10 rounded-xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm"
      aria-labelledby="support-insights-heading"
    >
      <h2 id="support-insights-heading" className="text-lg font-semibold text-slate-900">
        {strings['supportInsights.heading']}
      </h2>
      <p className="mt-1 text-xs text-slate-600">{strings['supportInsights.private_note']}</p>
      <p className="mt-2 text-sm text-slate-700">{strings['supportInsights.intro']}</p>
      <ul className="mt-4 space-y-4">
        {slice.map((s, i) => (
          <li key={`${s.type}-${i}`} className="rounded-lg border border-violet-100 bg-white px-4 py-3 shadow-sm">
            <span className="sr-only">
              {strings['supportInsights.signal_label']} {i + 1}
            </span>
            <p className="text-sm font-medium text-slate-900">{strings['supportInsights.observed']}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">{sanitizeGuidanceText(s.explanation)}</p>
            <p className="mt-3 text-sm font-medium text-slate-900">{strings['supportInsights.may_help']}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">{sanitizeGuidanceText(s.suggestion)}</p>
            <div className="mt-3 flex justify-end">
              <InsightConfidenceBadge
                band={s.confidence >= 0.66 ? 'high' : s.confidence >= 0.38 ? 'medium' : 'low'}
                strings={strings}
                uncertaintyTooltip={uncertainty}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
