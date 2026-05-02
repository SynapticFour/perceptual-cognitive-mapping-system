'use client';

import PendingSyncBanner from '@/components/offline/PendingSyncBanner';
import { useUiStrings } from '@/lib/use-ui-strings';

export default function LocaleOfflineChrome() {
  const ui = useUiStrings();
  return (
    <div className="container mx-auto max-w-6xl px-3 pt-2">
      <PendingSyncBanner strings={ui} />
    </div>
  );
}
