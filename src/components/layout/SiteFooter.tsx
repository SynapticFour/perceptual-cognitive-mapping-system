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
    <div className={className} role="contentinfo">
      <nav aria-label={t('nav_label')}>
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
            <Link href="/ethics" className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900">
              {t('ethics_doc')}
            </Link>
          </li>
          <li className="text-slate-300" aria-hidden>
            |
          </li>
          <li>
            <Link
              href="/validation"
              className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
            >
              {t('validation_protocol')}
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
      <p className="mt-3 text-center text-xs leading-relaxed text-slate-600">{t('prototype_line')}</p>
      <p className="mt-1 text-center text-xs text-slate-600">
        <a href="mailto:contact@synapticfour.com" className="underline decoration-slate-400 underline-offset-2">
          {t('contact')}
        </a>
        <span className="text-slate-300" aria-hidden>
          {' '}
          ·{' '}
        </span>
        <span>{t('license_mit')}</span>
      </p>
    </div>
  );
}
