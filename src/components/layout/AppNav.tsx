'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import DeleteMyDataButton from '@/components/ethics/DeleteMyDataButton';

export default function AppNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const linkCls = (href: string) =>
    `rounded-md px-3 py-2 font-medium transition-colors ${
      pathname === href ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-1" aria-label={t('home')}>
          <Link href="/" className={linkCls('/')}>
            {t('home')}
          </Link>
          <Link href="/introduction" className={linkCls('/introduction')}>
            {t('introduction')}
          </Link>
          <Link href="/consent" className={linkCls('/consent')}>
            {t('consent')}
          </Link>
          <Link href="/questionnaire" className={linkCls('/questionnaire')}>
            {t('questionnaire')}
          </Link>
          <Link href="/results" className={linkCls('/results')}>
            {t('results')}
          </Link>
          <Link href="/sms-profile" className={linkCls('/sms-profile')}>
            {t('sms_profile')}
          </Link>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <DeleteMyDataButton variant="nav" />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
