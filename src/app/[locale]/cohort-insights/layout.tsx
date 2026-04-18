import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Cohort Insights',
  description:
    'Aggregate, probabilistic guidance for environments—no individual identification, not a diagnostic view.',
};

export default function CohortInsightsLayout({ children }: { children: ReactNode }) {
  return children;
}
