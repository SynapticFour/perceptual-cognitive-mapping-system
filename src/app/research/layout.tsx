import type { ReactNode } from 'react';
import Link from 'next/link';

import { showValidationStatusBanner } from '@/config/env';
import ResearchNav from '@/components/research/ResearchNav';
import ResearchLogoutButton from '@/components/research/ResearchLogoutButton';

const VALIDATION_PROTOCOL_DOC_HREF =
  'https://github.com/SynapticFour/perceptual-cognitive-mapping-system/blob/main/docs/VALIDATION_PROTOCOL.md';

export const metadata = {
  title: 'PCMS Research',
  robots: 'noindex, nofollow',
};

export default function ResearchLayout({ children }: { children: ReactNode }) {
  const showValidationBanner = showValidationStatusBanner();

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      {showValidationBanner ? (
        <div
          role="status"
          className="border-b border-amber-500/50 bg-amber-950/95 px-4 py-3 text-center text-sm text-amber-100"
        >
          <strong className="font-semibold text-amber-50">Validation status: </strong>
          PCMS has not completed publication-standard empirical validation. Read the honest status and Phase 1
          roadmap in the{' '}
          <a
            href={VALIDATION_PROTOCOL_DOC_HREF}
            className="font-semibold text-amber-200 underline decoration-amber-400/80 underline-offset-2 hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            validation protocol (docs/VALIDATION_PROTOCOL.md)
          </a>
          .
        </div>
      ) : null}
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
