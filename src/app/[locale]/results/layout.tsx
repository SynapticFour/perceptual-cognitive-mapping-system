import type { ReactNode } from 'react';
import ErrorBoundary from '@/components/error-boundary';

export default function ResultsLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      title="Could not show results"
      body="We could not load or parse your saved session. Try completing the questionnaire again from the home page."
    >
      {children}
    </ErrorBoundary>
  );
}
