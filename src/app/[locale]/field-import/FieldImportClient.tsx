'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { loadQuestions } from '@/data/question-loader-browser';
import { parsePaperResponsesCsv } from '@/lib/paper-response-csv';
import { runPaperImportPipeline } from '@/lib/run-paper-import-pipeline';
import type { UiStrings } from '@/lib/ui-strings';

export default function FieldImportClient({ strings }: { strings: UiStrings }) {
  const router = useRouter();
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('pcms-consent-timestamp')) {
      router.replace('/consent');
    }
  }, [router]);

  const run = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await loadQuestions('universal');
      const history = parsePaperResponsesCsv(csvText);
      if (history.length === 0) {
        setError(strings['field.import_empty']);
        return;
      }
      const sessionId = localStorage.getItem('pcms-session-id') ?? `field_${Date.now()}`;
      if (!localStorage.getItem('pcms-session-id')) {
        localStorage.setItem('pcms-session-id', sessionId);
      }
      const stored = await runPaperImportPipeline({ history, sessionId });
      localStorage.setItem(
        'pcms-question-history',
        JSON.stringify(
          history.map((h) => ({
            questionId: h.questionId,
            response: h.response,
            responseTimeMs: h.responseTimeMs,
            timestamp: h.timestamp.toISOString(),
          }))
        )
      );
      localStorage.setItem('pcms-pipeline-result', JSON.stringify(stored));
      router.push('/results');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [csvText, router, strings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <main className="container mx-auto max-w-2xl px-3 py-8 sm:px-4">
        <h1 className="text-2xl font-semibold text-slate-900">{strings['field.import_page_title']}</h1>
        <p className="mt-2 text-sm text-slate-600">{strings['field.import_page_lead']}</p>
        <p className="mt-3 rounded-md border border-amber-100 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
          {strings['field.import_disclaimer']}
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-800">{strings['field.import_csv_label']}</label>
        <textarea
          className="mt-2 min-h-48 w-full rounded-lg border border-slate-200 p-3 font-mono text-xs"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={strings['field.import_csv_placeholder']}
        />
        <p className="mt-2 text-xs text-slate-500">{strings['field.import_csv_hint']}</p>

        <button
          type="button"
          disabled={busy}
          onClick={() => void run()}
          className="mt-4 min-h-11 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? strings['field.import_busy_ellipsis'] : strings['field.import_run']}
        </button>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </main>
    </div>
  );
}
