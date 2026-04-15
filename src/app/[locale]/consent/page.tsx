'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ROUTING_WEIGHT_KEYS, type RoutingWeightKey } from '@/adaptive/routing-tags';
import { appendEthicsAuditEvent } from '@/lib/ethics-audit';

const STEP_IDS = ['research', 'measured', 'limits', 'privacy', 'rights', 'ghana'] as const;
type StepId = (typeof STEP_IDS)[number];

export default function ConsentPage() {
  const router = useRouter();
  const t = useTranslations('ethics_consent');
  const tDims = useTranslations('dims');
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const total = STEP_IDS.length;
  const stepId = STEP_IDS[step];

  const dimKeys = useMemo(() => [...ROUTING_WEIGHT_KEYS] as RoutingWeightKey[], []);

  const goNext = () => {
    if (!confirmed) return;
    appendEthicsAuditEvent({ type: 'consent_step_completed', stepId });
    setConfirmed(false);
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      finishConsent([...STEP_IDS]);
    }
  };

  const finishConsent = (steps: StepId[]) => {
    appendEthicsAuditEvent({
      type: 'consent_flow_completed',
      meta: { stepsConfirmed: steps, consentVersion: '2.0' },
    });
    const ts = new Date().toISOString();
    localStorage.setItem('pcms-consent-timestamp', ts);
    localStorage.setItem(
      'pcms-consent-details',
      JSON.stringify({
        version: '2.0',
        timestamp: ts,
        stepsConfirmed: steps,
        ageConfirmation: true,
        voluntaryParticipation: true,
        dataUseAgreement: true,
      })
    );
    router.push('/questionnaire');
  };

  const sectionBody = () => {
    switch (stepId) {
      case 'research':
        return (
          <div className="space-y-3 text-slate-700">
            <p>{t('research_body')}</p>
          </div>
        );
      case 'measured':
        return (
          <div className="space-y-4 text-slate-700">
            <p>{t('measured_intro')}</p>
            <ul className="space-y-3 border-t border-slate-200 pt-3">
              {dimKeys.map((dim) => (
                <li key={dim} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{tDims(`${dim}.title`)}</p>
                  <p className="mt-1 text-sm">{tDims(`${dim}.description`)}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'limits':
        return <p className="text-slate-700">{t('limits_body')}</p>;
      case 'privacy':
        return <p className="text-slate-700">{t('privacy_body')}</p>;
      case 'rights':
        return <p className="text-slate-700">{t('rights_body')}</p>;
      case 'ghana':
        return <p className="text-slate-700">{t('ghana_body')}</p>;
      default:
        return null;
    }
  };

  const titleForStep = () => {
    switch (stepId) {
      case 'research':
        return t('research_title');
      case 'measured':
        return t('measured_title');
      case 'limits':
        return t('limits_title');
      case 'privacy':
        return t('privacy_title');
      case 'rights':
        return t('rights_title');
      case 'ghana':
        return t('ghana_title');
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-center text-sm font-medium text-slate-500">
          {t('progress', { n: step + 1, total })}
        </p>
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900 sm:text-3xl">{titleForStep()}</h1>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{sectionBody()}</div>

        <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-amber-50/80 p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span className="text-sm font-medium text-slate-900">{t('confirm_label')}</span>
        </label>

        <div className="flex flex-wrap gap-3">
          {step > 0 ? (
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-800 hover:bg-slate-50"
              onClick={() => {
                setConfirmed(false);
                setStep(step - 1);
              }}
            >
              {t('back')}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!confirmed}
            className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-700"
            onClick={goNext}
          >
            {step < total - 1 ? t('next') : t('finish')}
          </button>
        </div>
      </div>
    </div>
  );
}
