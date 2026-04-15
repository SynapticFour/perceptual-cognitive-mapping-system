import ResearchCompareCharts from '@/components/research/ResearchCompareCharts';
import { fetchComparePayload } from '@/lib/research-data';

export const dynamic = 'force-dynamic';

export default async function ResearchComparePage() {
  const data = await fetchComparePayload();

  if (!data.configured) {
    return (
      <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-6 text-amber-100">
        <h1 className="text-lg font-semibold">Supabase not configured</h1>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Cultural comparison</h1>
      <p className="mt-1 text-sm text-slate-400">
        Side-by-side means of routing-confidence profiles for <code className="text-slate-300">western</code> vs{' '}
        <code className="text-slate-300">ghana</code> cultural contexts (stored on profile rows). Universal / mixed
        contexts are excluded here.
      </p>
      {data.nWestern < 2 || data.nGhana < 2 ? (
        <p className="mt-4 text-sm text-amber-200">
          Not enough rows in one or both groups for stable inference (need at least 2 profiles per group).
        </p>
      ) : null}
      <div className="mt-8">
        <ResearchCompareCharts data={data} />
      </div>
    </div>
  );
}
