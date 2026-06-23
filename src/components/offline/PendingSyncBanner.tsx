'use client';

import { useEffect, useState } from 'react';
import {
  downloadAllPendingSessionFullExports,
  clearPendingOfflineSessions,
  getPendingSessions,
  OFFLINE_QUEUE_CHANGED_EVENT,
} from '@/lib/offline-storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isCloudResearchStorageEnabled } from '@/lib/research-cloud-consent';
import type { UiStrings } from '@/lib/ui-strings';

export default function PendingSyncBanner({ strings }: { strings: UiStrings }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!isCloudResearchStorageEnabled()) return;
    let cancelled = false;

    const refresh = () => {
      void getPendingSessions().then((s) => {
        if (!cancelled) setN(s.length);
      });
    };

    refresh();
    const id = window.setInterval(refresh, 12000);
    window.addEventListener('online', refresh);
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener('online', refresh);
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refresh);
    };
  }, []);

  if (!isSupabaseConfigured() || !isCloudResearchStorageEnabled() || n === 0) return null;

  const discard = () => {
    const msg = strings['offline.pending_sync_discard_confirm'].replace('{n}', String(n));
    if (!window.confirm(msg)) return;
    void clearPendingOfflineSessions().then(() => setN(0));
  };

  return (
    <div
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
      role="status"
    >
      <p>{strings['offline.pending_sync_banner'].replace('{n}', String(n))}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100"
          aria-label={strings['offline.pending_sync_export_aria']}
          onClick={() => {
            void downloadAllPendingSessionFullExports();
          }}
        >
          {strings['offline.pending_sync_export']}
        </button>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-amber-400/80 bg-transparent px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100/80"
          aria-label={strings['offline.pending_sync_discard_aria']}
          onClick={discard}
        >
          {strings['offline.pending_sync_discard']}
        </button>
      </div>
    </div>
  );
}
