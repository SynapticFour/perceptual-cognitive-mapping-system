import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Group cognitive overview',
  description:
    'Optional multi-profile overview: diversity, environment signals, and facilitation hints from combined share payloads.',
};

export default function GroupCognitiveAnalysisLayout({ children }: { children: ReactNode }) {
  return children;
}
