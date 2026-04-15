import type { ReactNode } from 'react';
import ErrorBoundary from '@/components/error-boundary';

export default function QuestionnaireLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      title="Something went wrong"
      body="The questionnaire hit an unexpected error. You can return home and try again."
    >
      {children}
    </ErrorBoundary>
  );
}
