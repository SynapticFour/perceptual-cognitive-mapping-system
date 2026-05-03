'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import SiteFooter from '@/components/layout/SiteFooter';
import { getConsentRuntimeMode } from '@/lib/ethics-flow-config';

export default function LandingPage() {
  const tWelcome = useTranslations('welcome');
  const tLanding = useTranslations('landing');
  const consentMode = getConsentRuntimeMode();
  const primaryHref = consentMode === 'skip' ? '/questionnaire' : '/consent';

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto flex flex-1 flex-col px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl flex-1">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">{tWelcome('title')}</h1>
          <p className="mb-2 text-xl text-gray-600">{tWelcome('subtitle')}</p>
          <p className="mb-8 text-left text-base leading-relaxed text-gray-700">{tLanding('lead')}</p>

          <div className="mb-10 grid gap-6 text-left sm:grid-cols-2">
            <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 p-4 sm:p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-900/90">
                {tLanding('diff_heading')}
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-sky-950">
                <li>{tLanding('diff_1')}</li>
                <li>{tLanding('diff_2')}</li>
                <li>{tLanding('diff_3')}</li>
              </ul>
            </div>
            <div className="rounded-xl border border-teal-200/80 bg-teal-50/60 p-4 sm:p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-900/90">
                {tLanding('get_heading')}
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-teal-950">
                <li>{tLanding('get_1')}</li>
                <li>{tLanding('get_2')}</li>
                <li>{tLanding('get_3')}</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={primaryHref}
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
      <footer className="border-t border-slate-200/80 bg-white/60 py-6 backdrop-blur-sm">
        <SiteFooter />
      </footer>
    </div>
  );
}
