'use client';

import { useEffect, useState } from 'react';
import { getPendingSessions } from '@/lib/offline-storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { UiStrings } from '@/lib/ui-strings';

export default function PendingSyncBanner({ strings }: { strings: UiStrings }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
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

  if (!isSupabaseConfigured() || n === 0) return null;

  return (
    <div
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
      role="status"
    >
      {strings['offline.pending_sync_banner'].replace('{n}', String(n))}
    </div>
  );
}
