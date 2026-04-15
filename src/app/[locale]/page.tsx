'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function LandingPage() {
  const tWelcome = useTranslations('welcome');
  const tLanding = useTranslations('landing');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">{tWelcome('title')}</h1>
        <p className="mb-2 text-xl text-gray-600">{tWelcome('subtitle')}</p>
        <p className="mb-10 text-left text-base leading-relaxed text-gray-700">{tLanding('lead')}</p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/consent"
            className="inline-block w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-purple-700 sm:w-auto"
          >
            {tLanding('cta_consent')}
          </Link>
          <Link
            href="/introduction"
            className="inline-block w-full rounded-lg border-2 border-slate-300 bg-white px-8 py-4 text-lg font-semibold text-slate-800 hover:bg-slate-50 sm:w-auto"
          >
            {tLanding('cta_intro')}
          </Link>
        </div>
      </div>
    </div>
  );
}
