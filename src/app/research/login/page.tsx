'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResearchLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/research/dashboard';
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch('/research/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ apiKey: key }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error === 'not_configured' ? 'Server is not configured.' : 'Invalid key.');
        return;
      }
      router.replace(next.startsWith('/research') ? next : '/research/dashboard');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-semibold text-white">Research access</h1>
      <p className="mt-2 text-sm text-slate-400">
        Enter the same value as <code className="text-slate-300">RESEARCH_API_KEY</code> in{' '}
        <code className="text-slate-300">.env.local</code>. API clients may send{' '}
        <code className="text-slate-300">x-research-api-key</code> instead.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-slate-300">
          API key
          <input
            type="password"
            autoComplete="off"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-sky-500"
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={pending || key.length < 8}
          className="w-full rounded-md bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {pending ? 'Checking…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

export default function ResearchLoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading…</div>}>
      <ResearchLoginForm />
    </Suspense>
  );
}
