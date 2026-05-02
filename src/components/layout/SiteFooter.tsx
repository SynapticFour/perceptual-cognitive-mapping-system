'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const IMPRINT_URL = 'https://synapticfour.com/de/impressum';
const GITHUB_URL = 'https://github.com/SynapticFour/perceptual-cognitive-mapping-system';

type Props = {
  className?: string;
};

export default function SiteFooter({ className }: Props) {
  const t = useTranslations('site_footer');

  return (
    <nav className={className} aria-label={t('nav_label')}>
      <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-slate-600">
        <li>
          <Link href="/privacy" className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900">
            {t('privacy')}
          </Link>
        </li>
        <li className="text-slate-300" aria-hidden>
          |
        </li>
        <li>
          <a
            href={IMPRINT_URL}
            className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('imprint')}
          </a>
        </li>
        <li className="text-slate-300" aria-hidden>
          |
        </li>
        <li>
          <a
            href={GITHUB_URL}
            className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('github')}
          </a>
        </li>
      </ul>
    </nav>
  );
}
