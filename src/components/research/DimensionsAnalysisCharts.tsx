'use client';

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { COGNITIVE_DIMENSION_KEYS } from '@/model/cognitive-dimensions';
import type { DimensionAnalysisPayload } from '@/lib/research-data';

function nearestKde(kde: { x: number; y: number }[], x: number): number {
  if (!kde.length) return 0;
  const p = kde.reduce((a, b) => (Math.abs(a.x - x) <= Math.abs(b.x - x) ? a : b));
  return p.y;
}

export default function DimensionsAnalysisCharts({ data }: { data: DimensionAnalysisPayload }) {
  return (
    <div className="space-y-10">
      <p className="text-xs text-slate-500">{data.retestNote}</p>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Histogram + KDE (routing confidence %)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {COGNITIVE_DIMENSION_KEYS.map((d) => {
            const hist = data.histograms[d];
            const kde = data.kdeByDimension[d];
            const maxCount = Math.max(1, ...hist.map((h) => h.count));
            const maxK = Math.max(1e-9, ...kde.map((k) => k.y));
            const chartData = hist.map((h) => ({
              bin: Math.round(h.bin),
              count: h.count,
              kde: nearestKde(kde, h.bin) * (maxCount / maxK),
            }));
            return (
              <div key={d} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <h3 className="mb-2 text-center text-xs font-semibold text-slate-300">Dimension {d}</h3>
                <div className="h-56 min-h-[14rem] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" stroke="#94a3b8" allowDecimals={false} width={32} />
                      <YAxis yAxisId="right" orientation="right" stroke="#64748b" width={1} hide />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="count" fill="#64748b" radius={[2, 2, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="kde"
                        stroke="#f472b6"
                        dot={false}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-200">Dimension correlation (Pearson r)</h2>
        <p className="mb-3 text-xs text-slate-500">Based on per-profile routing confidence vectors.</p>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-slate-800 bg-slate-900 p-2 text-left text-slate-400" />
                {COGNITIVE_DIMENSION_KEYS.map((c) => (
                  <th key={c} className="border border-slate-800 bg-slate-900 p-2 text-slate-300">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COGNITIVE_DIMENSION_KEYS.map((row, ri) => (
                <tr key={row}>
                  <th className="border border-slate-800 bg-slate-900/80 p-2 text-slate-300">{row}</th>
                  {COGNITIVE_DIMENSION_KEYS.map((col, ci) => {
                    if (ci >= ri) {
                      const r =
                        row === col
                          ? 1
                          : data.correlation.find((c) => (c.x === row && c.y === col) || (c.x === col && c.y === row))
                              ?.r ?? 0;
                      const hue = Math.round((r + 1) * 127.5);
                      return (
                        <td
                          key={col}
                          className="border border-slate-800 p-2 text-center font-mono text-slate-900"
                          style={{ background: `rgb(${255 - hue}, ${180 - Math.abs(r) * 80}, ${hue})` }}
                        >
                          {row === col ? '1' : r.toFixed(2)}
                        </td>
                      );
                    }
                    return <td key={col} className="border border-slate-800 bg-slate-950/50 p-2" />;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-200">Question discrimination (proxy)</h2>
        <p className="mb-3 text-xs text-slate-500">
          |Point-biserial-style correlation| between item response (1–5) and session mean response (same session).
          Higher ≈ more association with overall scale usage (not IRT a/b).
        </p>
        <div className="max-h-96 overflow-auto rounded-lg border border-slate-800">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="text-left text-slate-400">
                <th className="border-b border-slate-800 p-2">question_id</th>
                <th className="border-b border-slate-800 p-2">n</th>
                <th className="border-b border-slate-800 p-2">mean</th>
                <th className="border-b border-slate-800 p-2">sd</th>
                <th className="border-b border-slate-800 p-2">discrimination</th>
              </tr>
            </thead>
            <tbody>
              {data.questionStats.map((q) => (
                <tr key={q.questionId} className="border-b border-slate-800/80 hover:bg-slate-900/60">
                  <td className="p-2 font-mono text-xs text-slate-300">{q.questionId}</td>
                  <td className="p-2 text-slate-400">{q.n}</td>
                  <td className="p-2 text-slate-400">{q.mean.toFixed(2)}</td>
                  <td className="p-2 text-slate-400">{q.sd.toFixed(2)}</td>
                  <td className="p-2 text-emerald-300">{q.discrimination.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
