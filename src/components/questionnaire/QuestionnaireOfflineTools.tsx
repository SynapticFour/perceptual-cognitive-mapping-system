'use client';

import { useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { applyImportedQuestionBank } from '@/lib/question-bank-import';
import type { UiStrings } from '@/lib/ui-strings';

type Props = { strings: UiStrings };

export default function QuestionnaireOfflineTools({ strings }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50/90 p-4 text-left text-sm text-slate-700">
      <h2 className="font-semibold text-slate-900">{strings['field.offline_tools_heading']}</h2>
      <p className="mt-1 text-xs text-slate-600">{strings['field.offline_tools_body']}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            setMsg(null);
            try {
              const text = await f.text();
              const data: unknown = JSON.parse(text);
              await applyImportedQuestionBank(data, 'universal');
              setMsg(strings['field.bank_ready_reload']);
              window.location.reload();
            } catch (err) {
              setMsg(err instanceof Error ? err.message : String(err));
            }
          }}
        />
        <button
          type="button"
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-white"
          onClick={() => inputRef.current?.click()}
        >
          {strings['field.import_bank_file']}
        </button>
        <button
          type="button"
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-white"
          onClick={async () => {
            setMsg(null);
            try {
              const res = await fetch('/data/question-bank-universal-all.json', { cache: 'force-cache' });
              if (!res.ok) throw new Error(String(res.status));
              const data: unknown = await res.json();
              await applyImportedQuestionBank(data, 'universal');
              setMsg(strings['field.bank_ready_reload']);
              window.location.reload();
            } catch (e) {
              setMsg(e instanceof Error ? e.message : String(e));
            }
          }}
        >
          {strings['field.load_bundled_bank']}
        </button>
        <Link
          href="/field-import"
          className="min-h-11 inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-900 hover:bg-indigo-100"
        >
          {strings['field.paper_csv_link']}
        </Link>
      </div>
      {msg ? <p className="mt-2 text-xs text-slate-600">{msg}</p> : null}
    </div>
  );
}
