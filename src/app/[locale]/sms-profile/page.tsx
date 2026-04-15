'use client';

import { Suspense, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { COGNITIVE_DIMENSION_KEYS } from '@/model/cognitive-dimensions';
import { decodeProfileVectorCode } from '@/lib/sms-export';

function SmsProfileInner() {
  const t = useTranslations('sms_profile');
  const params = useSearchParams();
  const initial = params.get('c') ?? '';
  const [code, setCode] = useState(initial);
  const decoded = useMemo(() => decodeProfileVectorCode(code), [code]);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
      <p className="mt-2 text-sm text-slate-600">{t('intro')}</p>
      <label className="mt-6 block text-sm font-medium text-slate-800" htmlFor="sms-code">
        {t('code_label')}
      </label>
      <textarea
        id="sms-code"
        className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-mono text-sm"
        rows={3}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
      />
      {code.trim() && !decoded ? (
        <p className="mt-4 text-sm text-amber-800" role="status">
          {t('invalid')}
        </p>
      ) : null}
      {decoded ? (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-800">{t('dim_heading')}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {COGNITIVE_DIMENSION_KEYS.map((k) => (
              <li key={k} className="flex justify-between border-b border-slate-100 py-1">
                <span className="font-mono text-slate-700">{k}</span>
                <span className="text-slate-900">{Math.round(decoded[k])}%</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-8 text-xs text-slate-500">{t('twilio_note')}</p>
    </div>
  );
}

export default function SmsProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-10 text-sm text-slate-600" role="status">
          Loading…
        </div>
      }
    >
      <SmsProfileInner />
    </Suspense>
  );
}
