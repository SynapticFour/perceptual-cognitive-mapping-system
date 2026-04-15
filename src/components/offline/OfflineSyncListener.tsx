'use client';

import { useEffect } from 'react';
import { syncPendingSessions } from '@/lib/offline-supabase-sync';

/** Runs queued IndexedDB → Supabase sync when the tab goes online. */
export default function OfflineSyncListener() {
  useEffect(() => {
    const run = () => {
      void syncPendingSessions().catch((e) => console.error('Offline sync failed:', e));
    };
    run();
    window.addEventListener('online', run);
    return () => window.removeEventListener('online', run);
  }, []);

  return null;
}
