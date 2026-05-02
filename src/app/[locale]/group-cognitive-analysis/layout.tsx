import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'group_analysis' });
  return {
    title: t('title'),
    description: t('meta_description'),
  };
}

export default function GroupCognitiveAnalysisLayout({ children }: { children: ReactNode }) {
  return children;
}
