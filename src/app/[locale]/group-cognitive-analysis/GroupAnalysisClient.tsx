'use client';

import { useCallback, useMemo, useState } from 'react';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { buildCognitiveModel } from '@/core/cognitive-pipeline';
import {
  analyzeMultiProfileGroup,
  toPortableGroupAnalysisJson,
  type EnvironmentStressProfile,
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
import { formatUiString } from '@/lib/ui-strings';
import type { ConfidenceComponents } from '@/scoring';

const MAX_MEMBERS = 6;

const defaultEnvStress: EnvironmentStressProfile = {
  predictability01: 0.55,
  stimulation01: 0.35,
  interruption01: 0.38,
};

function humanizeRecCategory(id: string): string {
  return id
    .split('_')
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(' ');
}

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
  seed: number
): GroupMemberInput {
  const model = buildCognitiveModel({
    embeddingVector: new Array(32).fill(0).map((_, i) => (((i + seed) % 9) + Math.sin(seed * 0.3)) / 11),
    embeddingDimension: 32,
    display,
    confidenceComponents: confidence,
    syntheticCount: 56,
  });
  return { id, label, model, display };
}

export default function GroupAnalysisClient({ strings }: { strings: UiStrings }) {
  const [rows, setRows] = useState(() => [
    { label: strings['group_analysis.demo_row_1_label'], payload: '' },
    { label: strings['group_analysis.demo_row_2_label'], payload: '' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<GroupCognitiveAnalysisReport | null>(null);
  const [envStress, setEnvStress] = useState<EnvironmentStressProfile>(() => ({ ...defaultEnvStress }));

  const runDemo = useCallback(() => {
    setError(null);
    const conf = mockConfidence();
    const demoEnv: EnvironmentStressProfile = {
      predictability01: 0.28,
      stimulation01: 0.74,
      interruption01: 0.78,
    };
    setEnvStress(demoEnv);
    const members: GroupMemberInput[] = [
      buildMember('m0', strings['group_analysis.demo_profile_a'], makeDisplay(58), conf, 1),
      buildMember('m1', strings['group_analysis.demo_profile_b'], makeDisplay(58), conf, 2),
      buildMember('m2', strings['group_analysis.demo_profile_c'], makeDisplay(58), conf, 3),
    ];
    setReport(analyzeMultiProfileGroup(members, { environment: demoEnv }));
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
        buildMember(
          `m${idx}`,
          row.label.trim() ||
            formatUiString(strings['group_analysis.default_person_label'], { n: idx + 1 }),
          display,
          confidence,
          idx + 4
        )
      );
      idx++;
    }
    if (members.length < 2) {
      setError(strings['group_analysis.error_min']);
      return;
    }
    try {
      setReport(analyzeMultiProfileGroup(members, { environment: envStress }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [rows, strings, envStress]);

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

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">{strings['group_analysis.setting_context']}</h2>
          <p className="mt-1 text-xs text-slate-600">{strings['group_analysis.setting_context_hint']}</p>
          <div className="mt-3 space-y-3">
            <label className="block text-xs text-slate-600">
              {strings['group_analysis.predictability']}: {(envStress.predictability01 * 100).toFixed(0)}%
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(envStress.predictability01 * 100)}
                onChange={(e) =>
                  setEnvStress((s) => ({ ...s, predictability01: Number(e.target.value) / 100 }))
                }
                className="mt-1 block w-full accent-indigo-600"
              />
            </label>
            <label className="block text-xs text-slate-600">
              {strings['group_analysis.stimulation']}: {(envStress.stimulation01 * 100).toFixed(0)}%
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(envStress.stimulation01 * 100)}
                onChange={(e) =>
                  setEnvStress((s) => ({ ...s, stimulation01: Number(e.target.value) / 100 }))
                }
                className="mt-1 block w-full accent-indigo-600"
              />
            </label>
            <label className="block text-xs text-slate-600">
              {strings['group_analysis.interruption']}: {(envStress.interruption01 * 100).toFixed(0)}%
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(envStress.interruption01 * 100)}
                onChange={(e) =>
                  setEnvStress((s) => ({ ...s, interruption01: Number(e.target.value) / 100 }))
                }
                className="mt-1 block w-full accent-indigo-600"
              />
            </label>
          </div>
        </section>

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
              <label className="mt-2 block text-xs font-medium text-slate-600">
                {strings['group_analysis.payload_label']}
              </label>
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
              if (rows.length < MAX_MEMBERS)
                setRows([
                  ...rows,
                  {
                    label: formatUiString(strings['group_analysis.default_person_label'], {
                      n: rows.length + 1,
                    }),
                    payload: '',
                  },
                ]);
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
                {formatUiString(strings['group_analysis.diversity_score_line'], {
                  score: (report.diversity.score * 100).toFixed(1),
                })}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatUiString(strings['group_analysis.mean_pairwise'], {
                  value: report.diversity.meanPairwiseDistance.toFixed(3),
                })}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatUiString(strings['group_analysis.routing_entropy'], {
                  value: report.diversity.routingProfileEntropy01.toFixed(3),
                })}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">{strings['group_analysis.clusters']}</h2>
              <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-slate-700">
                {report.clusters.map((c) => (
                  <li key={c.id}>
                    {formatUiString(strings['group_analysis.cluster_row'], {
                      id: c.id,
                      member_list: c.memberIndices.map((i) => report.memberLabels[i]).join(', '),
                      summary: c.summary,
                    })}
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
              <h2 className="text-lg font-semibold text-slate-900">{strings['group_analysis.structured_recs']}</h2>
              <ul className="mt-2 space-y-3">
                {report.recommendationItems.map((item) => (
                  <li key={item.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800">
                    <p className="text-xs text-slate-500">
                      {formatUiString(strings['group_analysis.rec_category'], {
                        category: humanizeRecCategory(item.category),
                      })}
                    </p>
                    <p className="mt-1 font-medium text-slate-900">{item.text}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.rationale}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">{strings['group_analysis.friction']}</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {report.frictionSignals.slice(0, 5).map((f, i) => (
                  <li key={i}>
                    {formatUiString(strings['group_analysis.friction_line'], {
                      traits: f.traits.join(' ↔ '),
                      strength: f.strength.toFixed(2),
                      suggestion: f.suggestion,
                    })}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">{strings['group_analysis.environment']}</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {report.environmentSignals.slice(0, 6).map((e) => (
                  <li key={e.id}>
                    {formatUiString(strings['group_analysis.environment_line'], {
                      id: e.id,
                      intensity: e.intensity.toFixed(2),
                      narrative: e.narrative,
                    })}
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
