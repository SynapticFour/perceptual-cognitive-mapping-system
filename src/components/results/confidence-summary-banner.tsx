'use client';

import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import type { ConfidenceComponents } from '@/scoring';
import type { UiStrings } from '@/lib/ui-strings';

const THRESHOLD = 0.75;

export interface ConfidenceSummaryBannerProps {
  confidenceComponents: ConfidenceComponents;
  strings: UiStrings;
  /** Omitted for read-only shared views where continuing the questionnaire is not available. */
  onContinueAssessment?: () => void;
}

export default function ConfidenceSummaryBanner({
  confidenceComponents,
  strings,
  onContinueAssessment,
}: ConfidenceSummaryBannerProps) {
  const met = ROUTING_WEIGHT_KEYS.filter((d) => confidenceComponents[d].finalConfidence >= THRESHOLD).length;
  const allMet = met === ROUTING_WEIGHT_KEYS.length;

  const palette = allMet
    ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
    : met >= 7
      ? 'border-amber-300 bg-amber-50 text-amber-950'
      : 'border-rose-300 bg-rose-50 text-rose-950';

  const message = allMet ? strings['banner.all_met'] : met >= 7 ? strings['banner.most_met'] : strings['banner.low_met'];

  const showCta = !allMet && typeof onContinueAssessment === 'function';

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${palette}`} role="status" aria-live="polite">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium leading-snug">{message}</p>
        {showCta ? (
          <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end">
            <button
              type="button"
              onClick={() => onContinueAssessment?.()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {strings['banner.continue_cta']}
            </button>
            <span className="text-center text-[11px] text-slate-700 sm:text-right">{strings['banner.continue_hint']}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
