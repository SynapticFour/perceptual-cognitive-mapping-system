'use client';

import { getDimensionUi } from '@/lib/cognitive-dimensions-ui';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import { interpretDimensionScore } from '@/lib/interpretation';
import {
  PRIMARY_RESULTS_ROUTING_KEYS,
  RESEARCH_ROUTING_KEYS,
  type CognitiveDimension,
} from '@/model/cognitive-dimensions';
import type { ConfidenceComponents } from '@/scoring';
import type { UiStrings } from '@/lib/ui-strings';
import { formatUiString } from '@/lib/ui-strings';

export interface InsightCardsProps {
  confidenceComponents: ConfidenceComponents;
  display: DimensionDisplayModel;
  strings: UiStrings;
}

function DimensionGlyph({ dim }: { dim: CognitiveDimension }) {
  const common = { width: 28, height: 28, viewBox: '0 0 28 28', 'aria-hidden': true as const };
  switch (dim) {
    case 'F':
      return (
        <svg {...common}>
          <circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="14" cy="14" r="3" fill="currentColor" />
        </svg>
      );
    case 'P':
      return (
        <svg {...common}>
          <path d="M4 20 L14 6 L24 20 Z" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'S':
      return (
        <svg {...common}>
          <path d="M6 18 Q14 4 22 18" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'E':
      return (
        <svg {...common}>
          <circle cx="10" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="18" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'R':
      return (
        <svg {...common}>
          <rect x="6" y="6" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'C':
      return (
        <svg {...common}>
          <path d="M6 14 H22 M14 6 V22" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'T':
      return (
        <svg {...common}>
          <circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M14 14 L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 14 L19 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'I':
      return (
        <svg {...common}>
          <path
            d="M6 16 Q10 8 14 16 T22 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'A':
      return (
        <svg {...common}>
          <circle cx="9" cy="11" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="19" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="19" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 12 L17 10 M12 13 L15 17 M17 11 L17 17" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case 'V':
      return (
        <svg {...common}>
          <rect x="5" y="7" width="8" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 8 L24 8 L20 20 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    default:
      return null;
  }
}

function InsightCardRow({
  dim,
  confidenceComponents,
  display,
  strings,
}: {
  dim: CognitiveDimension;
  confidenceComponents: ConfidenceComponents;
  display: DimensionDisplayModel;
  strings: UiStrings;
}) {
  const meta = getDimensionUi(dim, strings);
  const raw01 = display.rawPercent[dim] / 100;
  const conf = confidenceComponents[dim].finalConfidence;
  const meets = confidenceComponents[dim].meetsMinimumSample;
  const lowConfidence = conf < 0.75;
  const muted = lowConfidence;
  const note = !meets
    ? strings['insights.confidence_note_sample']
    : lowConfidence
      ? strings['insights.confidence_note_generic']
      : null;

  return (
    <li
      title={muted ? strings['insights.deemphasized_tooltip'] : undefined}
      className={`flex gap-3 rounded-xl border p-4 shadow-sm ${
        muted
          ? 'border-dashed border-slate-300 bg-slate-50/90 italic text-slate-700'
          : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      <div className="shrink-0 text-slate-600" aria-hidden>
        <DimensionGlyph dim={dim} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`text-sm font-semibold ${muted ? '' : 'text-slate-900'}`}>{meta.title}</h3>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white not-italic tabular-nums">
            {display.rawPercent[dim].toFixed(0)}%
          </span>
          <span className="text-[11px] text-slate-500 not-italic">
            {formatUiString(strings['insights.confidence_compact'], {
              pct: (conf * 100).toFixed(0),
            })}
          </span>
        </div>
        <p className={`mt-2 text-sm leading-snug ${muted ? '' : 'text-slate-800'}`}>
          {interpretDimensionScore(dim, raw01, strings)}
        </p>
        {note ? <p className="mt-2 text-xs not-italic text-amber-800">{note}</p> : null}
      </div>
    </li>
  );
}

export default function InsightCards({ confidenceComponents, display, strings }: InsightCardsProps) {
  return (
    <section aria-label={strings['insights.aria']}>
      <p className="mb-3 text-sm text-slate-700">{strings['insights.caption']}</p>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PRIMARY_RESULTS_ROUTING_KEYS.map((dim) => (
          <InsightCardRow
            key={dim}
            dim={dim}
            confidenceComponents={confidenceComponents}
            display={display}
            strings={strings}
          />
        ))}
      </ul>
      <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-sm text-slate-800">
        <summary className="cursor-pointer select-none rounded-md px-2 py-2 font-medium text-slate-900 hover:bg-slate-100">
          {strings['insights.research_routing_disclosure_summary']}
        </summary>
        <ul className="mt-2 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
          {RESEARCH_ROUTING_KEYS.map((dim) => (
            <InsightCardRow
              key={dim}
              dim={dim}
              confidenceComponents={confidenceComponents}
              display={display}
              strings={strings}
            />
          ))}
        </ul>
      </details>
    </section>
  );
}
