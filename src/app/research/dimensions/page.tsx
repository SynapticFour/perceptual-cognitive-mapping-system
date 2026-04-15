import DimensionsAnalysisCharts from '@/components/research/DimensionsAnalysisCharts';
import { fetchDimensionAnalysisPayload } from '@/lib/research-data';

export const dynamic = 'force-dynamic';

export default async function ResearchDimensionsPage() {
  const data = await fetchDimensionAnalysisPayload();

  if (!data.configured) {
    return (
      <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-6 text-amber-100">
        <h1 className="text-lg font-semibold">Supabase not configured</h1>
        <p className="mt-2 text-sm">Connect Supabase to load item-level and profile analytics.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Dimension analysis</h1>
      <p className="mt-1 text-sm text-slate-400">
        Distributions, Pearson correlations between dimension confidences, and a simple item–total discrimination proxy
        from <code className="text-slate-300">question_responses</code>.
      </p>
      <div className="mt-8">
        <DimensionsAnalysisCharts data={data} />
      </div>
    </div>
  );
}
