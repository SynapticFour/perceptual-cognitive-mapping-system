'use client';

import type { ProfileAdaptiveSessionSummary } from '@/adaptive/profile-adaptive';
import type { UiStrings } from '@/lib/ui-strings';

export interface ProfileAdaptiveFootnoteProps {
  summary: ProfileAdaptiveSessionSummary;
  strings: UiStrings;
}

/** Research-facing note: within-session stability vs routing confidence (Epic B). */
export default function ProfileAdaptiveFootnote({ summary, strings }: ProfileAdaptiveFootnoteProps) {
  const key = 'results.profile_adaptive_footnote';
  const template = strings[key];
  if (!template) return null;

  const text = template
    .replace('{sessionConfidence}', String(Math.round(summary.sessionConfidence * 100)))
    .replace('{meanContradiction}', String(Math.round(summary.meanContradiction01 * 100)));

  return (
    <p
      className="mx-auto mb-4 max-w-3xl text-center text-xs leading-relaxed text-slate-600"
      role="note"
    >
      {text}
    </p>
  );
}
