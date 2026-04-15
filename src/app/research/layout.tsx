import type { ReactNode } from 'react';
import Link from 'next/link';

import ResearchNav from '@/components/research/ResearchNav';
import ResearchLogoutButton from '@/components/research/ResearchLogoutButton';

export const metadata = {
  title: 'PCMS Research',
  robots: 'noindex, nofollow',
};

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/research/dashboard" className="text-lg font-semibold tracking-tight text-white">
              PCMS Research Console
            </Link>
            <p className="mt-1 text-xs text-slate-400">
              Admin-only analytics. Not for participants. Use header{' '}
              <code className="rounded bg-slate-800 px-1">x-research-api-key</code> or browser login.
            </p>
          </div>
          <ResearchLogoutButton />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-4">
          <ResearchNav />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
