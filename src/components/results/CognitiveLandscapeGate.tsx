'use client';

import dynamic from 'next/dynamic';
import type { CognitiveLandscapeProps } from '@/components/results/CognitiveLandscape';

const Skeleton = () => (
  <div
    className="mx-auto max-w-6xl animate-pulse space-y-6 rounded-xl border border-slate-200 bg-white p-6"
    aria-hidden
  >
    <div className="h-24 rounded-lg bg-slate-100" />
    <div className="h-72 rounded-lg bg-slate-100" />
    <div className="h-48 rounded-lg bg-slate-100" />
  </div>
);

const CognitiveLandscape = dynamic(() => import('@/components/results/CognitiveLandscape'), {
  ssr: false,
  loading: () => <Skeleton />,
});

/** Latent map + PNG export stay client-only. */
export default function CognitiveLandscapeGate(props: CognitiveLandscapeProps) {
  return <CognitiveLandscape {...props} />;
}
