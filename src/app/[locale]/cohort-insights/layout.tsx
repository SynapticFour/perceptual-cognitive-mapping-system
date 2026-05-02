import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'cohortInsights' });
  return {
    title: t('page_title'),
    description: t('meta_description'),
  };
}

export default function CohortInsightsLayout({ children }: { children: ReactNode }) {
  return children;
}
