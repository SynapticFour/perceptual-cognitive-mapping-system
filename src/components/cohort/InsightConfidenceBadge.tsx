'use client';

import type { InsightConfidenceBand } from '@/cohort/ux-types';
import type { UiStrings } from '@/lib/ui-strings';

export interface InsightConfidenceBadgeProps {
  band: InsightConfidenceBand;
  strings: UiStrings;
  /** Tooltip body (probabilistic nature). */
  uncertaintyTooltip: string;
}

export default function InsightConfidenceBadge({
  band,
  strings,
  uncertaintyTooltip,
}: InsightConfidenceBadgeProps) {
  const label =
    band === 'high'
      ? strings['a11y.confidence_badge_high']
      : band === 'medium'
        ? strings['a11y.confidence_badge_mid']
        : strings['a11y.confidence_badge_low'];
  const cls =
    band === 'high'
      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
      : band === 'medium'
        ? 'bg-amber-100 text-amber-950 border-amber-200'
        : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex cursor-help items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}
      title={uncertaintyTooltip}
      tabIndex={0}
    >
      {label}
    </span>
  );
}
