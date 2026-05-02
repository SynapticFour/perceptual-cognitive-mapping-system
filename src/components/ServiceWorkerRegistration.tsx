'use client';

import { useEffect } from 'react';

/** Registers `/sw.js` to precache the static question bank for offline cold-start after install. */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const onLoad = () => {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        /* non-fatal: offline tooling still works via /data/* and IndexedDB */
      });
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}
