'use client';

import { useMemo, useState } from 'react';
import { useLocale, useMessages } from 'next-intl';
import { FEATURE_FLAGS } from '@/config/feature-flags';

const STORAGE_PREFIX = 'pcms-locale-review-banner-dismissed:';

type LocaleReviewMeta = {
  reviewStatus?: string;
  lastReviewed?: string;
  checklistDoc?: string;
  outstandingItems?: string[];
};

function showReviewWarnings(): boolean {
  return (
    process.env.NODE_ENV !== 'production' || FEATURE_FLAGS.LOCALE_REVIEW_WARNINGS
  );
}

export default function UnreviewedLocaleWarner() {
  const locale = useLocale();
  const messages = useMessages() as Record<string, unknown>;
  const meta = messages._localeReview as LocaleReviewMeta | undefined;

  const [dismissVersion, setDismissVersion] = useState(0);
  const dismissed = useMemo(() => {
    void dismissVersion;
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}${locale}`) === '1';
    } catch {
      return false;
    }
  }, [locale, dismissVersion]);

  if (!showReviewWarnings()) {
    return null;
  }

  if (!meta || meta.reviewStatus !== 'PENDING_NATIVE_REVIEW' || dismissed) {
    return null;
  }

  const items = Array.isArray(meta.outstandingItems) ? meta.outstandingItems : [];

  const dismiss = () => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${locale}`, '1');
    } catch {
      /* ignore */
    }
    setDismissVersion((v) => v + 1);
  };

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950 shadow-sm"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">
            Locale copy: native cultural review pending ({locale})
          </p>
          <p className="mt-1 text-amber-900/90">
            Last reviewed: {meta.lastReviewed ?? 'unknown'}. See{' '}
            {meta.checklistDoc ? (
              <span className="font-mono text-xs">{meta.checklistDoc}</span>
            ) : (
              'docs/CULTURAL_REVIEW_CHECKLIST.md'
            )}{' '}
            for the checklist. This banner only appears in non-production builds or when{' '}
            <span className="font-mono">NEXT_PUBLIC_LOCALE_REVIEW_WARNINGS=true</span>.
          </p>
          {items.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs sm:text-sm">
              {items.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100"
        >
          Dismiss for this browser
        </button>
      </div>
    </div>
  );
}
