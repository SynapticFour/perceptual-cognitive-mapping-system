'use client';

import { useEffect, useState } from 'react';
import { downloadAllPendingSessionFullExports, getPendingSessions } from '@/lib/offline-storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isCloudResearchStorageEnabled } from '@/lib/research-cloud-consent';
import type { UiStrings } from '@/lib/ui-strings';

export default function PendingSyncBanner({ strings }: { strings: UiStrings }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!isCloudResearchStorageEnabled()) return;
    const tick = () => {
      void getPendingSessions().then((s) => setN(s.length));
    };
    tick();
    const id = window.setInterval(tick, 12000);
    window.addEventListener('online', tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('online', tick);
    };
  }, []);

  if (!isSupabaseConfigured() || !isCloudResearchStorageEnabled() || n === 0) return null;

  return (
    <div
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
      role="status"
    >
      <p>{strings['offline.pending_sync_banner'].replace('{n}', String(n))}</p>
      <button
        type="button"
        className="mt-2 inline-flex min-h-10 items-center justify-center rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100"
        aria-label={strings['offline.pending_sync_export_aria']}
        onClick={() => {
          void downloadAllPendingSessionFullExports();
        }}
      >
        {strings['offline.pending_sync_export']}
      </button>
    </div>
  );
}
