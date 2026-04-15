'use client';

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { COGNITIVE_DIMENSION_KEYS } from '@/model/cognitive-dimensions';
import type { ComparePayload } from '@/lib/research-data';

export default function ResearchCompareCharts({ data }: { data: ComparePayload }) {
  const westernRows = COGNITIVE_DIMENSION_KEYS.map((d) => ({ dim: d, score: data.western[d] }));
  const ghanaRows = COGNITIVE_DIMENSION_KEYS.map((d) => ({ dim: d, score: data.ghana[d] }));

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-center text-sm font-medium text-slate-300">
            Western (n = {data.nWestern})
          </h3>
          <div className="h-72 min-h-[18rem] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={westernRows} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                <Radar name="Western mean" dataKey="score" stroke="#38bdf8" fill="#38bdf844" strokeWidth={2} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-center text-sm font-medium text-slate-300">Ghana (n = {data.nGhana})</h3>
          <div className="h-72 min-h-[18rem] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={ghanaRows} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                <Radar name="Ghana mean" dataKey="score" stroke="#f472b6" fill="#f472b644" strokeWidth={2} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-200">Welch t-test (Western − Ghana) on mean confidence</h3>
        <p className="mb-3 text-xs text-slate-500">
          Exploratory; assumes approximate normality. Cohen&apos;s d uses pooled SD. p-values not shown — use t and df
          in R: <code className="text-slate-400">2*pt(-abs(t), df)</code>.
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-900 text-left text-slate-400">
              <tr>
                <th className="border-b border-slate-800 p-2">Dim</th>
                <th className="border-b border-slate-800 p-2">t</th>
                <th className="border-b border-slate-800 p-2">df</th>
                <th className="border-b border-slate-800 p-2">Cohen d</th>
              </tr>
            </thead>
            <tbody>
              {data.tests.map((row) => (
                <tr key={row.dimension} className="border-b border-slate-800/80">
                  <td className="p-2 font-mono text-slate-200">{row.dimension}</td>
                  <td className="p-2 text-slate-300">{row.t.toFixed(3)}</td>
                  <td className="p-2 text-slate-400">{row.df.toFixed(1)}</td>
                  <td className="p-2 text-slate-300">{row.cohenD.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
