'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { PCMS_LOCALE_STORAGE_KEY } from '@/components/i18n/locale-constants';

export default function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <span className="whitespace-nowrap font-medium">{t('label')}</span>
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label={t('label')}
        value={locale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          if (!routing.locales.includes(next as (typeof routing.locales)[number])) return;
          try {
            localStorage.setItem(PCMS_LOCALE_STORAGE_KEY, next);
          } catch {
            /* ignore */
          }
          startTransition(() => {
            router.replace(pathname, { locale: next });
          });
        }}
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
