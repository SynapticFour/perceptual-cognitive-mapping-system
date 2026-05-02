'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { DimensionDisplayModel } from '@/lib/dimension-display';

const CORE_DIMS = ['F', 'P', 'S', 'E', 'R', 'C'] as const;

type CoreDim = (typeof CORE_DIMS)[number];

function topCoreDimensions(display: DimensionDisplayModel, n: number): { key: CoreDim; pct: number }[] {
  const ranked = CORE_DIMS.map((key) => ({ key, pct: display.rawPercent[key] }))
    .sort((a, b) => b.pct - a.pct || a.key.localeCompare(b.key));
  return ranked.slice(0, n);
}

export default function ResultsInterpretationSection({ display }: { display: DimensionDisplayModel }) {
  const t = useTranslations('results_interpretation');
  const tDims = useTranslations('dims');
  const locale = useLocale();

  const researchUrl =
    locale === 'de'
      ? 'https://synapticfour.com/de/pcm-research-note'
      : 'https://synapticfour.com/en/pcm-research-note';

  const top = useMemo(() => topCoreDimensions(display, 3), [display]);

  return (
    <section
      className="mb-10 max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      aria-labelledby="results-interpretation-heading"
    >
      <h2 id="results-interpretation-heading" className="text-lg font-semibold text-slate-900 sm:text-xl">
        {t('heading')}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">{t('para1')}</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
        {t.rich('para2', {
          research: (chunks) => (
            <a
              href={researchUrl}
              className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              {chunks}
            </a>
          ),
        })}
      </p>

      <div className="mt-6 rounded-lg border border-emerald-200/80 bg-emerald-50/60 p-4 sm:p-5">
        <h3 className="text-base font-semibold text-emerald-950">{t('strengths_heading')}</h3>
        <p className="mt-1 text-xs text-emerald-900/80 sm:text-sm">{t('strengths_sub')}</p>
        <ul className="mt-3 space-y-2 text-sm text-emerald-950">
          {top.map(({ key, pct }) => (
            <li key={key} className="leading-relaxed">
              <span className="font-medium">{tDims(`${key}.title`)}</span>
              <span className="text-emerald-800/90"> ({pct}%)</span>
              <span className="text-emerald-900"> — {t(`strength_${key}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
