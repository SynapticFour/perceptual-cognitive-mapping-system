'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { appendEthicsAuditEvent } from '@/lib/ethics-audit';

const PIPELINE_KEY = 'pcms-pipeline-result';

type Props = {
  /** Prefer pipeline session id; falls back to pcms-session-id in storage. */
  sessionId?: string | null;
  variant?: 'nav' | 'prominent';
};

function clearLocalParticipantData() {
  const keys = [
    PIPELINE_KEY,
    'pcms-question-history',
    'pcms-consent-timestamp',
    'pcms-consent-details',
    'pcms-assessment-context',
    'pcms-consent-record',
  ];
  for (const k of keys) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

export default function DeleteMyDataButton({ sessionId: sessionIdProp, variant = 'prominent' }: Props) {
  const t = useTranslations('ethics_delete');
  const tr = useTranslations('ethics_results');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const resolveSessionId = () => {
    if (sessionIdProp) return sessionIdProp;
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(PIPELINE_KEY);
      if (raw) {
        const o: unknown = JSON.parse(raw);
        if (typeof o === 'object' && o !== null && 'sessionId' in o && typeof (o as { sessionId: unknown }).sessionId === 'string') {
          return (o as { sessionId: string }).sessionId;
        }
      }
      return localStorage.getItem('pcms-session-id');
    } catch {
      return localStorage.getItem('pcms-session-id');
    }
  };

  const runDelete = async () => {
    setBusy(true);
    setMsg(null);
    const sessionId = resolveSessionId();
    appendEthicsAuditEvent({
      type: 'data_deletion_requested',
      sessionId: sessionId ?? undefined,
      meta: { source: 'ui_delete_button' },
    });

    if (sessionId) {
      try {
        const res = await fetch('/api/delete-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data: unknown = await res.json().catch(() => ({}));
        if (!res.ok && typeof data === 'object' && data !== null && 'error' in data) {
          setMsg(String((data as { error: string }).error));
        }
      } catch {
        setMsg(t('error'));
      }
    }

    clearLocalParticipantData();
    appendEthicsAuditEvent({
      type: 'data_deletion_completed',
      sessionId: sessionId ?? undefined,
      meta: { source: 'ui_local_cleared' },
    });
    setBusy(false);
    setOpen(false);
    setMsg(t('done'));
    router.replace('/');
  };

  const btnClass =
    variant === 'nav'
      ? 'rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50'
      : 'rounded-lg border-2 border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50';

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button type="button" className={btnClass} onClick={() => setOpen(true)} disabled={busy}>
        {variant === 'nav' ? tr('delete_label') : t('button')}
      </button>
      {variant === 'prominent' ? <span className="max-w-sm text-xs text-slate-600">{tr('delete_help')}</span> : null}

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-slate-900">{t('confirm_title')}</h3>
            <p className="mb-4 text-sm text-slate-600">{t('confirm_body')}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={busy}
                onClick={() => void runDelete()}
              >
                {t('confirm_action')}
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-slate-300 py-2 font-medium text-slate-800 hover:bg-slate-50"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {msg ? <p className="text-xs text-green-700">{msg}</p> : null}
    </div>
  );
}
