'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { COGNITIVE_DIMENSION_KEYS } from '@/model/cognitive-dimensions';
import type { DashboardPayload } from '@/lib/research-data';

const COL = '#38bdf8';

export default function ResearchDashboardCharts({ data }: { data: DashboardPayload }) {
  const contextData = Object.entries(data.sessionsByContext).map(([name, value]) => ({ name, value }));
  const radarRows = COGNITIVE_DIMENSION_KEYS.map((d) => ({
    dim: d,
    mean: data.meanDimensionConfidence[d],
  }));
  const lineData = data.sessionsByDay;

  const completionPct =
    data.started > 0 ? Math.round((data.completedSessions / data.started) * 1000) / 10 : 0;

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sessions (started)" value={String(data.started)} />
        <Stat label="Completed (terminal status)" value={String(data.completedSessions)} />
        <Stat label="Profiles saved" value={String(data.profilesCount)} />
        <Stat label="Completion rate" value={`${completionPct}%`} />
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-200">Sessions by cultural context</h2>
        <div className="h-64 min-h-[16rem] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contextData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
              <Bar dataKey="value" name="Sessions" fill={COL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-200">Sessions over time</h2>
        <p className="mb-3 text-xs text-slate-500">Count of sessions created per calendar day (UTC).</p>
        <div className="h-64 min-h-[16rem] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
              <Line type="monotone" dataKey="count" name="Sessions" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-200">Population mean — routing confidence by dimension</h2>
        <p className="mb-3 text-xs text-slate-500">
          Mean of per-dimension <code className="text-slate-400">finalConfidence</code> (0–100) from stored pipeline
          JSON. Based on {data.parseableProfiles} parseable profiles.
        </p>
        <div className="h-80 min-h-[20rem] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarRows} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="dim" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name="Mean %" dataKey="mean" stroke={COL} fill={`${COL}55`} strokeWidth={2} />
              <Legend />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Per-dimension distribution (histogram)</h2>
        <p className="mb-3 text-xs text-slate-500">
          Routing confidence (0–100) per profile. KDE overlay is on the Dimensions analysis page.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COGNITIVE_DIMENSION_KEYS.map((d) => {
            const hist = data.histograms[d];
            const chartData = hist.map((h) => ({
              bin: Math.round(h.bin),
              count: h.count,
            }));
            return (
              <div key={d} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <h3 className="mb-2 text-center text-xs font-semibold text-slate-300">Dimension {d}</h3>
                <div className="h-48 min-h-[12rem] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 9 }} />
                      <YAxis stroke="#94a3b8" allowDecimals={false} width={28} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 11 }} />
                      <Bar dataKey="count" fill="#64748b" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
