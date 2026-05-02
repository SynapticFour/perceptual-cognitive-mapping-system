'use client';

import type { CognitiveProfilePublic } from '@/types/profile-public';
import type { UiStrings } from '@/lib/ui-strings';

type Props = {
  profile: CognitiveProfilePublic;
  responseCount: number;
  completedLabel: string;
  strings: UiStrings;
};

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Opens a minimal print view (participant summary) in a new window — works with field browsers and avoids layout/CSS conflicts.
 */
export default function ParticipantPrintSheet({ profile, responseCount, completedLabel, strings }: Props) {
  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) {
      window.alert(strings['results.print_popup_blocked']);
      return;
    }
    const patterns =
      profile.patterns.length > 0
        ? `<h2 style="font-size:14px;margin-top:1rem">${esc(strings['results.patterns_heading'])}</h2><ul>${profile.patterns.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`
        : '';
    w.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${esc(strings['results.print_heading'])}</title>
      <style>body{font-family:system-ui,sans-serif;padding:1.5rem;max-width:40rem;color:#111}h1{font-size:1.25rem}p,li{font-size:0.9rem;line-height:1.5}</style></head><body>
      <h1>${esc(strings['results.print_heading'])}</h1>
      <p style="color:#444;font-size:0.85rem">${esc(strings['results.print_meta'].replace('{count}', String(responseCount)).replace('{date}', completedLabel))}</p>
      <p style="margin-top:1rem">${esc(profile.summary)}</p>
      ${patterns}
      <p style="margin-top:2rem;font-size:0.75rem;color:#666">${esc(strings['results.print_footer'])}</p>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="mx-auto mb-4 max-w-2xl text-center">
      <button
        type="button"
        onClick={handlePrint}
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
      >
        {strings['results.print_summary']}
      </button>
    </div>
  );
}
