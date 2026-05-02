import type { ReactNode } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ErrorBoundary from '@/components/error-boundary';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ResultsLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('errorBoundary');
  const tQ = await getTranslations('questionnaire');
  return (
    <ErrorBoundary
      title={t('results_title')}
      body={t('results_body')}
      returnHomeLabel={tQ('return_home')}
    >
      {children}
    </ErrorBoundary>
  );
}
