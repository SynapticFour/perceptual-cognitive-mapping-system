import Link from 'next/link';

import { fetchProfileExplorer } from '@/lib/research-data';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    culture?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function ResearchProfilesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;
  const sort = sp.sort === 'time' || sp.sort === 'confidence' ? sp.sort : 'created';

  const { rows, total } = await fetchProfileExplorer({
    from: sp.from,
    to: sp.to,
    culture: sp.culture,
    completion: 'all',
    sort,
    limit,
    offset,
  });

  const listQ = new URLSearchParams();
  if (sp.from) listQ.set('from', sp.from);
  if (sp.to) listQ.set('to', sp.to);
  if (sp.culture) listQ.set('culture', sp.culture);
  if (sp.sort) listQ.set('sort', sp.sort);
  const listQs = listQ.toString();

  const baseExport = '/research/api/export?format=csv';
  const jsonExport = '/research/api/export?format=json';

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Profile explorer</h1>
      <p className="mt-1 text-sm text-slate-400">
        Anonymised rows (no raw item responses). Bulk export for SPSS/R. Filters apply to the latest 2500 profiles in
        memory on the server.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={baseExport}
          className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Download CSV
        </a>
        <a
          href={jsonExport}
          className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600"
        >
          Download JSON
        </a>
      </div>

      <form
        method="get"
        action="/research/profiles"
        className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm"
      >
        <label className="flex flex-col gap-1 text-slate-400">
          From
          <input type="date" name="from" defaultValue={sp.from} className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100" />
        </label>
        <label className="flex flex-col gap-1 text-slate-400">
          To
          <input type="date" name="to" defaultValue={sp.to} className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100" />
        </label>
        <label className="flex flex-col gap-1 text-slate-400">
          Culture
          <select name="culture" defaultValue={sp.culture ?? 'all'} className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100">
            <option value="all">All</option>
            <option value="western">Western</option>
            <option value="ghana">Ghana</option>
            <option value="universal">Universal</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-slate-400">
          Sort
          <select name="sort" defaultValue={sort} className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100">
            <option value="created">Completion / created</option>
            <option value="time">Completion time (sec)</option>
            <option value="confidence">Interpretation confidence</option>
          </select>
        </label>
        <button type="submit" className="rounded-md bg-sky-700 px-3 py-2 font-medium text-white hover:bg-sky-600">
          Apply
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        Showing {rows.length} of {total} after filters. Page {page}.{' '}
        {total > offset + rows.length ? (
          <Link
            className="text-sky-400 underline"
            href={`/research/profiles?${listQs ? `${listQs}&` : ''}page=${page + 1}`}
          >
            Next
          </Link>
        ) : null}
        {page > 1 ? (
          <>
            {' '}
            <Link
              className="text-sky-400 underline"
              href={`/research/profiles?${listQs ? `${listQs}&` : ''}page=${page - 1}`}
            >
              Prev
            </Link>
          </>
        ) : null}
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-slate-900 text-slate-400">
            <tr>
              <th className="border-b border-slate-800 p-2">Anon ID</th>
              <th className="border-b border-slate-800 p-2">Created</th>
              <th className="border-b border-slate-800 p-2">Context</th>
              <th className="border-b border-slate-800 p-2">Responses</th>
              <th className="border-b border-slate-800 p-2">Time (s)</th>
              <th className="border-b border-slate-800 p-2">Interp. conf.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.anonId} className="border-b border-slate-800/80 hover:bg-slate-900/50">
                <td className="p-2 font-mono text-xs text-slate-200">{r.anonId}</td>
                <td className="p-2 text-slate-400">{r.createdAt.slice(0, 19)}</td>
                <td className="p-2 text-slate-300">{r.culturalContext}</td>
                <td className="p-2 text-slate-400">{r.responseCount}</td>
                <td className="p-2 text-slate-400">{r.completionSeconds}</td>
                <td className="p-2 text-slate-300">
                  {r.interpretationConfidence == null ? '—' : r.interpretationConfidence.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
