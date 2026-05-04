import ResearchDashboardCharts from '@/components/research/ResearchDashboardCharts';
import { fetchDashboardPayload } from '@/lib/research-data';

export const dynamic = 'force-dynamic';

export default async function ResearchDashboardPage() {
  const data = await fetchDashboardPayload();

  if (!data.configured) {
    return (
      <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-6 text-amber-100">
        <h1 className="text-lg font-semibold">Supabase not configured</h1>
        <p className="mt-2 text-sm text-amber-200/90">
          Set <code className="text-amber-100">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="text-amber-100">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to populate this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Research overview</h1>
      <p className="mt-1 text-sm text-slate-400">
        Aggregates from <code className="text-slate-300">sessions</code> and{' '}
        <code className="text-slate-300">profiles</code>. Dimension values are routing-confidence means (0–100) for
        research summaries — not labels for individual medical, educational, or placement decisions.
      </p>
      <div className="mt-8">
        <ResearchDashboardCharts data={data} />
      </div>
    </div>
  );
}
