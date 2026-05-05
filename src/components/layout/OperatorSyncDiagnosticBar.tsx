'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { showOperatorSyncDiagnostic } from '@/config/env';
import { readCloudSyncTelemetry, readCloudSyncTelemetryHistory } from '@/lib/cloud-sync-telemetry';
import { getPendingSessions } from '@/lib/offline-storage';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function OperatorSyncDiagnosticBar() {
  const t = useTranslations('operatorSync');
  const locale = useLocale();
  const [tick, setTick] = useState(0);
  const [pending, setPending] = useState<number | null>(null);

  const enabled = showOperatorSyncDiagnostic();

  useEffect(() => {
    if (!enabled) return;
    const bump = () => setTick((n) => n + 1);
    const id = window.setInterval(bump, 10000);
    window.addEventListener('pcms-cloud-sync-telemetry', bump);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('pcms-cloud-sync-telemetry', bump);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setPending(null);
        return;
      }
      const s = await getPendingSessions();
      if (!cancelled) setPending(s.length);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);

  if (!enabled) return null;

  const cloud = isSupabaseConfigured();
  const telemetry = readCloudSyncTelemetry();
  const failCount = readCloudSyncTelemetryHistory().filter((row) => !row.ok).length;
  const timeStr = telemetry ? new Date(telemetry.at).toLocaleString(String(locale)) : '';
  const errorHint = telemetry?.ok
    ? ''
    : [telemetry?.errorCode, telemetry?.errorMessage].filter(Boolean).join(': ').slice(0, 180);

  return (
    <div
      className="border-b border-amber-300/90 bg-amber-50 px-3 py-2 text-center text-xs leading-snug text-amber-950"
      role="status"
      aria-label={t('bar_aria')}
    >
      <span className="font-semibold">{t('bar_title')}</span>
      {' · '}
      <span>{cloud ? t('env_on') : t('env_off')}</span>
      {' · '}
      {telemetry ? (
        <span>
          {t('last_line', {
            status: telemetry.ok ? t('status_ok') : t('status_fail'),
            context: telemetry.context,
            time: timeStr,
          })}
          {!telemetry.ok && errorHint ? ` (${errorHint})` : ''}
        </span>
      ) : (
        <span>{t('last_never')}</span>
      )}
      {failCount > 0 ? (
        <>
          {' · '}
          <span>Failed attempts (browser history): {failCount}</span>
        </>
      ) : null}
      {cloud && pending !== null && pending > 0 ? (
        <>
          {' · '}
          <span>{t('pending', { n: pending })}</span>
        </>
      ) : null}
    </div>
  );
}
