'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ROUTING_WEIGHT_KEYS, type RoutingWeightKey } from '@/adaptive/routing-tags';
import { appendEthicsAuditEvent } from '@/lib/ethics-audit';
import {
  buildConsentSteps,
  getConsentRuntimeMode,
  type ConsentStepId,
  writePcmsConsentLocalStorage,
} from '@/lib/ethics-flow-config';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function ConsentPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('ethics_consent');
  const tDims = useTranslations('dims');
  const runtimeMode = getConsentRuntimeMode();

  const steps = useMemo(
    () => buildConsentSteps({ mode: runtimeMode === 'qa_all_steps' ? 'qa_all_steps' : 'default', locale }),
    [runtimeMode, locale]
  );

  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const total = steps.length;
  const stepId = steps[step] ?? steps[0];

  const dimKeys = useMemo(() => [...ROUTING_WEIGHT_KEYS] as RoutingWeightKey[], []);

  useEffect(() => {
    if (runtimeMode !== 'skip') return;
    appendEthicsAuditEvent({
      type: 'consent_flow_completed',
      meta: { consentVersion: '2.0', consentMode: 'skip', stepsConfirmed: steps },
    });
    writePcmsConsentLocalStorage(steps, { consentMode: 'skip' });
    router.replace('/questionnaire');
  }, [runtimeMode, router, steps]);

  if (runtimeMode === 'skip') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-center text-slate-600">{t('skip_redirect')}</p>
      </div>
    );
  }

  const goNext = () => {
    if (!confirmed) return;
    appendEthicsAuditEvent({ type: 'consent_step_completed', stepId });
    setConfirmed(false);
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      finishConsent([...steps]);
    }
  };

  const finishConsent = (confirmedSteps: ConsentStepId[]) => {
    appendEthicsAuditEvent({
      type: 'consent_flow_completed',
      meta: { stepsConfirmed: confirmedSteps, consentVersion: '2.0' },
    });
    writePcmsConsentLocalStorage(confirmedSteps);
    router.push('/questionnaire');
  };

  const sectionBody = (id: ConsentStepId) => {
    switch (id) {
      case 'streamlined_core':
        return (
          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">{t('research_title')}</h2>
              <p className="mt-2">{t('research_body')}</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-slate-900">{t('measured_title')}</h2>
              <p className="mt-2">{t('measured_intro')}</p>
              <ul className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                {dimKeys.map((dim) => (
                  <li key={dim} className="rounded-lg bg-slate-50 p-3">
                    <p className="font-semibold text-slate-900">{tDims(`${dim}.title`)}</p>
                    <p className="mt-1 text-sm">{tDims(`${dim}.description`)}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        );
      case 'streamlined_safeguards':
        return (
          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-base font-semibold text-slate-900">{t('limits_title')}</h2>
              <p className="mt-2">{t('limits_body')}</p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-slate-900">{t('privacy_title')}</h2>
              <p className="mt-2">{t('privacy_body_local')}</p>
              {isSupabaseConfigured() ? <p className="mt-2">{t('privacy_body_cloud_extra')}</p> : null}
            </section>
            <section>
              <h2 className="text-base font-semibold text-slate-900">{t('rights_title')}</h2>
              <p className="mt-2">{t('rights_body')}</p>
            </section>
          </div>
        );
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
        return (
          <div className="space-y-2 text-slate-700">
            <p>{t('privacy_body_local')}</p>
            {isSupabaseConfigured() ? <p>{t('privacy_body_cloud_extra')}</p> : null}
          </div>
        );
      case 'rights':
        return <p className="text-slate-700">{t('rights_body')}</p>;
      case 'ghana':
        return <p className="text-slate-700">{t('ghana_body')}</p>;
      default:
        return null;
    }
  };

  const titleForStep = (id: ConsentStepId) => {
    switch (id) {
      case 'streamlined_core':
        return t('streamlined_bundle_title');
      case 'streamlined_safeguards':
        return t('streamlined_safeguards_title');
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
        <p className="mb-5 rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-center text-base leading-relaxed text-slate-700 shadow-sm">
          {t('page_intro_cal')}
        </p>
        {runtimeMode === 'qa_all_steps' ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-900">
            {t('qa_mode_banner')}
          </p>
        ) : null}
        <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm text-slate-700">
          {t('storage_notice_local')}
          {isSupabaseConfigured() ? <> {t('storage_notice_cloud_extra')}</> : null}
        </p>
        <p className="mb-2 text-center text-sm font-medium text-slate-500">
          {t('progress', { n: step + 1, total })}
        </p>
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900 sm:text-3xl">{titleForStep(stepId)}</h1>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{sectionBody(stepId)}</div>

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
