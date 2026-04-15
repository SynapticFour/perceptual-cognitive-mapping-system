'use client';

import { useTranslations } from 'next-intl';
import type { AssessmentContext } from '@/types/assessment-context';

type Props = {
  context: AssessmentContext | null;
};

export default function EthicsResultsBanner({ context }: Props) {
  const t = useTranslations('ethics_results');
  const showGhana = context?.culturalContext === 'ghana';

  return (
    <aside
      className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm sm:p-5"
      role="region"
      aria-label={t('banner_title')}
    >
      <h2 className="mb-2 text-lg font-bold sm:text-xl">{t('banner_title')}</h2>
      <ul className="list-inside list-disc space-y-1 text-sm sm:text-base">
        <li>{t('non_medical')}</li>
        <li>{t('non_diagnosis')}</li>
        <li>{t('non_judgement')}</li>
        {showGhana ? <li>{t('ghana_medical')}</li> : null}
      </ul>
    </aside>
  );
}
