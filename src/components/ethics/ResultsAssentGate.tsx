'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AssessmentContext } from '@/types/assessment-context';
import { PCMS_ASSESSMENT_CONTEXT_KEY } from '@/types/assessment-context';
import { appendEthicsAuditEvent } from '@/lib/ethics-audit';
import EthicsResultsBanner from '@/components/ethics/EthicsResultsBanner';

type Props = {
  onComplete: (ctx: AssessmentContext) => void;
};

const CULTURAL: AssessmentContext['culturalContext'][] = ['western', 'ghana', 'universal'];
const USES: AssessmentContext['intendedUse'][] = ['self-understanding', 'research', 'education', 'other'];

export default function ResultsAssentGate({ onComplete }: Props) {
  const t = useTranslations('ethics_assent');
  const [culturalContext, setCulturalContext] = useState<AssessmentContext['culturalContext']>('universal');
  const [intendedUse, setIntendedUse] = useState<AssessmentContext['intendedUse']>('self-understanding');
  const [nonDiag, setNonDiag] = useState(false);
  const [researchOnly, setResearchOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!nonDiag || !researchOnly) {
      setError(t('error_incomplete'));
      return;
    }
    const ctx: AssessmentContext = {
      culturalContext,
      intendedUse,
      userAcknowledgedNonDiagnostic: true,
      userAcknowledgedResearchOnly: true,
    };
    try {
      localStorage.setItem(PCMS_ASSESSMENT_CONTEXT_KEY, JSON.stringify(ctx));
    } catch {
      /* ignore */
    }
    appendEthicsAuditEvent({
      type: 'results_assent_completed',
      meta: { culturalContext, intendedUse },
    });
    onComplete(ctx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assent-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4">
          <EthicsResultsBanner context={null} />
        </div>
        <h2 id="assent-title" className="mb-2 text-xl font-bold text-slate-900">
          {t('title')}
        </h2>
        <p className="mb-4 text-sm text-slate-600">{t('intro')}</p>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="cultural">
            {t('cultural_label')}
          </label>
          <select
            id="cultural"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
            value={culturalContext}
            onChange={(e) => setCulturalContext(e.target.value as AssessmentContext['culturalContext'])}
          >
            {CULTURAL.map((c) => (
              <option key={c} value={c}>
                {c === 'western'
                  ? t('cultural_western')
                  : c === 'ghana'
                    ? t('cultural_ghana')
                    : t('cultural_universal')}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="use">
            {t('use_label')}
          </label>
          <select
            id="use"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
            value={intendedUse}
            onChange={(e) => setIntendedUse(e.target.value as AssessmentContext['intendedUse'])}
          >
            {USES.map((u) => (
              <option key={u} value={u}>
                {u === 'self-understanding'
                  ? t('use_self')
                  : u === 'research'
                    ? t('use_research')
                    : u === 'education'
                      ? t('use_education')
                      : t('use_other')}
              </option>
            ))}
          </select>
        </div>

        <label className="mb-3 flex items-start gap-2 text-sm text-slate-800">
          <input type="checkbox" className="mt-1" checked={nonDiag} onChange={(e) => setNonDiag(e.target.checked)} />
          <span>{t('chk_nondiagnostic')}</span>
        </label>

        <label className="mb-4 flex items-start gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            className="mt-1"
            checked={researchOnly}
            onChange={(e) => setResearchOnly(e.target.checked)}
          />
          <span>{t('chk_research')}</span>
        </label>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
          onClick={submit}
        >
          {t('submit')}
        </button>
      </div>
    </div>
  );
}
