'use client';

import { useLocale } from 'next-intl';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { PCMS_LOCALE_STORAGE_KEY } from '@/components/i18n/locale-constants';

/**
 * If the user previously chose a locale in this browser, prefer it over the
 * default from the first navigation (cookie / Accept-Language may differ).
 */
export default function LocaleFromStorage() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(PCMS_LOCALE_STORAGE_KEY);
    } catch {
      return;
    }
    if (!stored || stored === locale) return;
    if (!routing.locales.includes(stored as (typeof routing.locales)[number])) return;
    router.replace(pathname, { locale: stored });
  }, [locale, pathname, router]);

  return null;
}
