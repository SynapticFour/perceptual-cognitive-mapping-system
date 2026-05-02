'use client';

import { useCallback, useMemo, useState } from 'react';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { buildCognitiveModel } from '@/core/cognitive-pipeline';
import {
  analyzeMultiProfileGroup,
  toPortableGroupAnalysisJson,
  type GroupCognitiveAnalysisReport,
  type GroupMemberInput,
} from '@/lib/group-cognitive-analysis';
import {
  confidenceComponentsFromSharePayload,
  decodeLandscapeSharePayload,
  displayModelFromSharePayload,
} from '@/lib/landscape-share-codec';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import type { UiStrings } from '@/lib/ui-strings';
import type { ConfidenceComponents } from '@/scoring';

const MAX_MEMBERS = 6;

function extractPayloadToken(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  try {
    const u = new URL(s, typeof window !== 'undefined' ? window.location.origin : 'https://local.invalid');
    const p = u.searchParams.get('p');
    if (p) return p;
  } catch {
    /* not a URL */
  }
  return s;
}

function mockConfidence(): ConfidenceComponents {
  return Object.fromEntries(
    ROUTING_WEIGHT_KEYS.map((d) => [
      d,
      {
        effectiveEvidence: 1,
        reliability: 1,
        consistency: 1,
        finalConfidence: 0.75,
        meetsMinimumSample: true,
      },
    ])
  ) as ConfidenceComponents;
}

function makeDisplay(center: number): DimensionDisplayModel {
  const rawPercent = Object.fromEntries(
    ROUTING_WEIGHT_KEYS.map((d) => [d, Math.max(5, Math.min(95, center + (d.charCodeAt(0) % 7) * 2))])
  ) as DimensionDisplayModel['rawPercent'];
  const weightedPercent = { ...rawPercent };
  const itemsContributing = Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 1])) as DimensionDisplayModel['itemsContributing'];
  return { rawPercent, weightedPercent, itemsContributing };
}

function buildMember(
  id: string,
  label: string,
  display: DimensionDisplayModel,
  confidence: ConfidenceComponents,
  ui: UiStrings,
  seed: number
): GroupMemberInput {
  const model = buildCognitiveModel({
    embeddingVector: new Array(32).fill(0).map((_, i) => (((i + seed) % 9) + Math.sin(seed * 0.3)) / 11),
    embeddingDimension: 32,
    display,
    confidenceComponents: confidence,
    strings: ui,
    syntheticCount: 56,
  });
  return { id, label, model, display };
}

export default function GroupAnalysisClient({ strings }: { strings: UiStrings }) {
  const [rows, setRows] = useState(() => [
    { label: 'Person 1', payload: '' },
    { label: 'Person 2', payload: '' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<GroupCognitiveAnalysisReport | null>(null);

  const runDemo = useCallback(() => {
    setError(null);
    const conf = mockConfidence();
    const members: GroupMemberInput[] = [
      buildMember('m0', 'Demo A', makeDisplay(42), conf, strings, 1),
      buildMember('m1', 'Demo B', makeDisplay(58), conf, strings, 2),
      buildMember('m2', 'Demo C', makeDisplay(51), conf, strings, 3),
    ];
    setReport(analyzeMultiProfileGroup(members));
  }, [strings]);

  const runAnalyze = useCallback(() => {
    setError(null);
    const members: GroupMemberInput[] = [];
    let idx = 0;
    for (const row of rows) {
      const token = extractPayloadToken(row.payload);
      if (!token) continue;
      const decoded = decodeLandscapeSharePayload(token);
      if (!decoded) {
        setError(strings['group_analysis.error_parse']);
        return;
      }
      const display = displayModelFromSharePayload(decoded);
      const confidence = confidenceComponentsFromSharePayload(decoded);
      members.push(
        buildMember(`m${idx}`, row.label.trim() || `Person ${idx + 1}`, display, confidence, strings, idx + 4)
      );
      idx++;
    }
    if (members.length < 2) {
      setError(strings['group_analysis.error_min']);
      return;
    }
    try {
      setReport(analyzeMultiProfileGroup(members));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [rows, strings]);

  const portableJson = useMemo(() => (report ? JSON.stringify(toPortableGroupAnalysisJson(report), null, 2) : ''), [report]);

  const downloadJson = useCallback(() => {
    if (!report) return;
    const blob = new Blob([portableJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `group-cognitive-analysis-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [portableJson, report]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <main className="container mx-auto max-w-3xl px-3 py-8 sm:px-4">
        <h1 className="text-2xl font-semibold text-slate-900">{strings['group_analysis.title']}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{strings['group_analysis.lead']}</p>
        <p className="mt-3 rounded-md border border-amber-100 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">{strings['group_analysis.disclaimer']}</p>

        <p className="mt-4 text-sm text-slate-700">{strings['group_analysis.instructions']}</p>

        <div className="mt-4 space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <label className="block text-xs font-medium text-slate-600">{strings['group_analysis.member_label']}</label>
              <input
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                value={row.label}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = { ...next[idx]!, label: e.target.value };
                  setRows(next);
                }}
              />
              <label className="mt-2 block text-xs font-medium text-slate-600">Payload</label>
              <textarea
                className="mt-1 min-h-[4.5rem] w-full rounded border border-slate-200 px-2 py-1.5 font-mono text-xs"
                placeholder={strings['group_analysis.payload_placeholder']}
                value={row.payload}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = { ...next[idx]!, payload: e.target.value };
                  setRows(next);
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
            onClick={runAnalyze}
          >
            {strings['group_analysis.analyze']}
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            onClick={() => {
              if (rows.length < MAX_MEMBERS) setRows([...rows, { label: `Person ${rows.length + 1}`, payload: '' }]);
            }}
          >
            {strings['group_analysis.add_member']}
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            onClick={runDemo}
          >
            {strings['group_analysis.demo_data']}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

        {report ? (
          <div className="mt-10 space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">{strings['group_analysis.narrative']}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{report.summaryNarrative}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">{strings['group_analysis.diversity']}</h2>
              <p className="mt-2 text-sm text-slate-700">
                Score: <span className="font-mono">{(report.diversity.score * 100).toFixed(1)}</span> / 100 (model scale)
              </p>
              <p className="mt-1 text-xs text-slate-500">Mean pairwise distance (normalized routing): {report.diversity.meanPairwiseDistance.toFixed(3)}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">{strings['group_analysis.clusters']}</h2>
              <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-slate-700">
                {report.clusters.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">{c.id}</span> — members {c.memberIndices.map((i) => report.memberLabels[i]).join(', ')}. {c.summary}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">{strings['group_analysis.risks']}</h2>
              <ul className="mt-2 space-y-3">
                {report.risks.map((r) => (
                  <li key={r.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                    <span className="font-medium text-slate-900">{r.title}</span>{' '}
                    <span className="text-xs uppercase text-slate-500">({r.severity})</span>
                    <p className="mt-1 text-slate-700">{r.explanation}</p>
                    <p className="mt-1 text-slate-600">{r.suggestion}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">{strings['group_analysis.recommendations']}</h2>
              <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
                {report.recommendations.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">{strings['group_analysis.friction']}</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {report.frictionSignals.slice(0, 5).map((f, i) => (
                  <li key={i}>
                    {f.traits.join(' ↔ ')} — strength {f.strength.toFixed(2)}: {f.suggestion}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">{strings['group_analysis.environment']}</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {report.environmentSignals.slice(0, 6).map((e) => (
                  <li key={e.id}>
                    <span className="font-medium">{e.id}</span> ({e.intensity.toFixed(2)}): {e.narrative}
                  </li>
                ))}
              </ul>
            </section>

            <button
              type="button"
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
              onClick={downloadJson}
            >
              {strings['group_analysis.download_json']}
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
