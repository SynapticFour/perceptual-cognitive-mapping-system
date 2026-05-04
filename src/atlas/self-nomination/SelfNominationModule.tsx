'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import { ATLAS_DESCRIPTORS, type AtlasDescriptor } from '@/atlas/self-nomination/atlas-descriptors';
import { descriptorDisplayText } from '@/atlas/self-nomination/descriptor-display-text';

export interface SelfNominationModuleProps {
  locale: string;
  linkedSessionId?: string;
  onComplete: (selectedIds: string[], options?: { explicitNone?: boolean }) => void;
  onSkip: () => void;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function SelfNominationModule({
  locale,
  linkedSessionId: _linkedSessionId,
  onComplete,
  onSkip,
}: SelfNominationModuleProps) {
  void _linkedSessionId;

  const t = useTranslations('selfNomination');

  const [reveal, setReveal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const id = window.setTimeout(() => setReveal(true), 300);
    return () => window.clearTimeout(id);
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const count = selected.size;

  const sortedDescriptors = useMemo(
    () => [...ATLAS_DESCRIPTORS].filter((d) => d.culturalContext === 'universal'),
    []
  );

  const handleContinue = () => {
    onComplete([...selected], { explicitNone: false });
  };

  const handleNoneOfThese = () => {
    setSelected(new Set());
    onComplete([], { explicitNone: true });
  };

  if (!FEATURE_FLAGS.ATLAS_SELF_NOMINATION) return null;

  return (
    <section
      className={`mx-auto mb-10 max-w-5xl transition-opacity duration-500 ease-out ${
        reveal ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-labelledby="self-nomination-heading"
    >
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50 to-white px-4 py-8 shadow-md sm:px-8">
        <header className="mb-2 text-center">
          <h2 id="self-nomination-heading" className="text-xl font-semibold text-slate-900 sm:text-2xl">
            {t('heading')}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{t('subheading')}</p>
          <p className="mx-auto mt-3 max-w-2xl rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs leading-relaxed text-slate-600">
            {t('disclaimer')}
          </p>
        </header>

        <p className="mb-4 text-center text-sm font-medium text-slate-700" aria-live="polite">
          {t('selectedCount', { count })}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedDescriptors.map((d: AtlasDescriptor) => {
            const isOn = selected.has(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggle(d.id)}
                className={`relative rounded-xl border-2 bg-slate-50/90 px-4 pb-10 pt-3 text-left text-sm leading-snug text-slate-800 shadow-sm transition-all duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                  isOn
                    ? 'border-[color:var(--color-accent)] shadow-[0_0_0_3px_rgba(13,148,136,0.15)]'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
                aria-pressed={isOn}
              >
                {isOn ? (
                  <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white shadow">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                ) : null}
                <span className="block pr-8">{descriptorDisplayText(d, locale)}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <button
            type="button"
            onClick={handleNoneOfThese}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            {t('noneOfThese')}
          </button>
          <button
            type="button"
            onClick={() => void handleContinue()}
            className="rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-teal-800"
          >
            {t('cta')}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl px-5 py-3 text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
          >
            {t('skip')}
          </button>
        </div>
      </div>
    </section>
  );
}
