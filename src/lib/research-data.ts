import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database.types';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/config/env';
import { COGNITIVE_DIMENSION_KEYS, type CognitiveDimension } from '@/model/cognitive-dimensions';
import {
  extractDimensionConfidencesFromProfileJson,
  overallInterpretationConfidence,
  type DimensionConfidenceRow,
} from '@/lib/research-pipeline-extract';
import { cohenD, histogramBins, kdePoints, mean, pearson, welchTTest } from '@/lib/research-stats-math';

export type ResearchReadClient = ReturnType<typeof createResearchReadClient>;

export function createResearchReadClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}

function isFinishedSuccess(s: string): boolean {
  return s === 'completed' || s === 'confidence_met' || s === 'max_questions' || s === 'user_exit';
}

function emptyDimRow(): DimensionConfidenceRow {
  const o = {} as DimensionConfidenceRow;
  for (const d of COGNITIVE_DIMENSION_KEYS) o[d] = 0;
  return o;
}

function emptyHistograms(): DashboardPayload['histograms'] {
  const h = {} as DashboardPayload['histograms'];
  for (const d of COGNITIVE_DIMENSION_KEYS) h[d] = [];
  return h;
}

function emptyKde(): DashboardPayload['kdeByDimension'] {
  const k = {} as DashboardPayload['kdeByDimension'];
  for (const d of COGNITIVE_DIMENSION_KEYS) k[d] = [];
  return k;
}

export type DashboardPayload = {
  configured: boolean;
  sessionsByContext: Record<string, number>;
  started: number;
  completedSessions: number;
  profilesCount: number;
  abandoned: number;
  inProgress: number;
  /** Mean per-dimension routing confidence (0–100) from stored pipeline JSON. */
  meanDimensionConfidence: DimensionConfidenceRow;
  parseableProfiles: number;
  sessionsByDay: { day: string; count: number }[];
  histograms: Record<CognitiveDimension, { bin: number; count: number }[]>;
  kdeByDimension: Record<CognitiveDimension, { x: number; y: number }[]>;
};

export async function fetchDashboardPayload(): Promise<DashboardPayload> {
  const client = createResearchReadClient();
  if (!client) {
    return {
      configured: false,
      sessionsByContext: {},
      started: 0,
      completedSessions: 0,
      profilesCount: 0,
      abandoned: 0,
      inProgress: 0,
      meanDimensionConfidence: emptyDimRow(),
      parseableProfiles: 0,
      sessionsByDay: [],
      histograms: emptyHistograms(),
      kdeByDimension: emptyKde(),
    };
  }

  const { data: sessions, error: sErr } = await client.from('sessions').select('id,cultural_context,completion_status,created_at');
  if (sErr || !sessions) {
    return {
      configured: true,
      sessionsByContext: {},
      started: 0,
      completedSessions: 0,
      profilesCount: 0,
      abandoned: 0,
      inProgress: 0,
      meanDimensionConfidence: emptyDimRow(),
      parseableProfiles: 0,
      sessionsByDay: [],
      histograms: emptyHistograms(),
      kdeByDimension: emptyKde(),
    };
  }

  const byContext: Record<string, number> = {};
  let abandoned = 0;
  let inProgress = 0;
  let completedSessions = 0;
  const dayMap = new Map<string, number>();

  for (const row of sessions) {
    byContext[row.cultural_context] = (byContext[row.cultural_context] ?? 0) + 1;
    if (row.completion_status === 'abandoned') abandoned += 1;
    else if (row.completion_status === 'in_progress') inProgress += 1;
    if (isFinishedSuccess(row.completion_status)) completedSessions += 1;
    const day = row.created_at?.slice(0, 10) ?? '';
    if (day) dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }

  const sessionsByDay = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));

  const { data: profiles, error: pErr } = await client
    .from('profiles')
    .select('id,session_id,cognitive_vector,response_count,completion_time_seconds,cultural_context,created_at');

  const profilesCount = profiles?.length ?? 0;
  const sums = emptyDimRow();
  let parseable = 0;

  const dimSamples: Record<CognitiveDimension, number[]> = {
    F: [],
    P: [],
    S: [],
    E: [],
    R: [],
    C: [],
    T: [],
    I: [],
    A: [],
    V: [],
  };

  if (!pErr && profiles) {
    for (const p of profiles) {
      const row = extractDimensionConfidencesFromProfileJson(p.cognitive_vector as Json);
      if (!row) continue;
      parseable += 1;
      for (const d of COGNITIVE_DIMENSION_KEYS) {
        sums[d] += row[d];
        dimSamples[d].push(row[d]);
      }
    }
  }

  const meanDimensionConfidence = emptyDimRow();
  if (parseable > 0) {
    for (const d of COGNITIVE_DIMENSION_KEYS) {
      meanDimensionConfidence[d] = Math.round((sums[d] / parseable) * 10) / 10;
    }
  }

  const histograms = {} as DashboardPayload['histograms'];
  const kdeByDimension = {} as DashboardPayload['kdeByDimension'];
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    const vals = dimSamples[d];
    histograms[d] = histogramBins(vals, 12, 0, 100);
    kdeByDimension[d] = vals.length >= 3 ? kdePoints(vals, 0, 100, 48) : [];
  }

  return {
    configured: true,
    sessionsByContext: byContext,
    started: sessions.length,
    completedSessions,
    profilesCount,
    abandoned,
    inProgress,
    meanDimensionConfidence,
    parseableProfiles: parseable,
    sessionsByDay,
    histograms,
    kdeByDimension,
  };
}

export type ProfileExplorerRow = {
  anonId: string;
  createdAt: string;
  culturalContext: string;
  responseCount: number;
  completionSeconds: number;
  interpretationConfidence: number | null;
};

export type ProfileExplorerResult = {
  rows: ProfileExplorerRow[];
  total: number;
};

export async function fetchProfileExplorer(params: {
  from?: string;
  to?: string;
  culture?: string;
  completion?: 'all' | 'with_profile' | 'incomplete';
  sort?: 'confidence' | 'time' | 'created';
  limit: number;
  offset: number;
}): Promise<ProfileExplorerResult> {
  const client = createResearchReadClient();
  if (!client) return { rows: [], total: 0 };

  const { data, error } = await client
    .from('profiles')
    .select('id,session_id,cognitive_vector,response_count,completion_time_seconds,cultural_context,created_at')
    .order('created_at', { ascending: false })
    .limit(2500);

  if (error || !data) return { rows: [], total: 0 };

  let rows: ProfileExplorerRow[] = data.map((p) => ({
    anonId: `p_${String(p.id).slice(0, 8)}`,
    createdAt: p.created_at,
    culturalContext: p.cultural_context,
    responseCount: p.response_count,
    completionSeconds: p.completion_time_seconds,
    interpretationConfidence: overallInterpretationConfidence(p.cognitive_vector as Json),
  }));

  if (params.from) rows = rows.filter((r) => r.createdAt >= `${params.from}T00:00:00.000Z`);
  if (params.to) rows = rows.filter((r) => r.createdAt <= `${params.to}T23:59:59.999Z`);
  if (params.culture && params.culture !== 'all') rows = rows.filter((r) => r.culturalContext === params.culture);
  if (params.completion === 'incomplete') {
    rows = [];
  }

  const total = rows.length;
  if (params.sort === 'confidence') {
    rows.sort((a, b) => (b.interpretationConfidence ?? 0) - (a.interpretationConfidence ?? 0));
  } else if (params.sort === 'time') {
    rows.sort((a, b) => a.completionSeconds - b.completionSeconds);
  } else {
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const page = rows.slice(params.offset, params.offset + params.limit);
  return { rows: page, total };
}

export type DimensionAnalysisPayload = {
  configured: boolean;
  histograms: DashboardPayload['histograms'];
  kdeByDimension: DashboardPayload['kdeByDimension'];
  correlation: { x: CognitiveDimension; y: CognitiveDimension; r: number }[];
  questionStats: { questionId: string; n: number; mean: number; sd: number; discrimination: number }[];
  retestNote: string;
};

export async function fetchDimensionAnalysisPayload(): Promise<DimensionAnalysisPayload> {
  const client = createResearchReadClient();
  if (!client) {
    return {
      configured: false,
      histograms: emptyHistograms(),
      kdeByDimension: emptyKde(),
      correlation: [],
      questionStats: [],
      retestNote: 'Supabase not configured.',
    };
  }

  const { data: profiles } = await client.from('profiles').select('cognitive_vector');
  const dimSamples: Record<CognitiveDimension, number[]> = {
    F: [],
    P: [],
    S: [],
    E: [],
    R: [],
    C: [],
    T: [],
    I: [],
    A: [],
    V: [],
  };
  const vectors: DimensionConfidenceRow[] = [];
  for (const p of profiles ?? []) {
    const row = extractDimensionConfidencesFromProfileJson(p.cognitive_vector as Json);
    if (!row) continue;
    vectors.push(row);
    for (const d of COGNITIVE_DIMENSION_KEYS) dimSamples[d].push(row[d]);
  }

  const histograms = {} as DashboardPayload['histograms'];
  const kdeByDimension = {} as DashboardPayload['kdeByDimension'];
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    const vals = dimSamples[d];
    histograms[d] = histogramBins(vals, 14, 0, 100);
    kdeByDimension[d] = vals.length >= 3 ? kdePoints(vals, 0, 100, 48) : [];
  }

  const correlation: DimensionAnalysisPayload['correlation'] = [];
  for (let i = 0; i < COGNITIVE_DIMENSION_KEYS.length; i++) {
    for (let j = i + 1; j < COGNITIVE_DIMENSION_KEYS.length; j++) {
      const a = COGNITIVE_DIMENSION_KEYS[i]!;
      const b = COGNITIVE_DIMENSION_KEYS[j]!;
      const va = vectors.map((v) => v[a]);
      const vb = vectors.map((v) => v[b]);
      correlation.push({ x: a, y: b, r: pearson(va, vb) });
    }
  }

  const { data: qr } = await client.from('question_responses').select('question_id,response,session_id');
  const byQ = new Map<string, number[]>();
  for (const row of qr ?? []) {
    const arr = byQ.get(row.question_id) ?? [];
    arr.push(row.response);
    byQ.set(row.question_id, arr);
  }
  const sessionMeans = new Map<string, number>();
  const bySession = new Map<string, number[]>();
  for (const row of qr ?? []) {
    const arr = bySession.get(row.session_id) ?? [];
    arr.push(row.response);
    bySession.set(row.session_id, arr);
  }
  for (const [sid, vals] of bySession) {
    sessionMeans.set(sid, mean(vals));
  }

  const questionStats: DimensionAnalysisPayload['questionStats'] = [];
  for (const [questionId, vals] of byQ) {
    if (vals.length < 5) continue;
    const m = mean(vals);
    const sd = Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, vals.length - 1));
    const pairs: { x: number; y: number }[] = [];
    for (const row of qr ?? []) {
      if (row.question_id !== questionId) continue;
      const sm = sessionMeans.get(row.session_id);
      if (sm === undefined) continue;
      pairs.push({ x: row.response, y: sm });
    }
    const xs = pairs.map((p) => p.x);
    const ys = pairs.map((p) => p.y);
    const discrimination = pairs.length >= 5 ? Math.abs(pearson(xs, ys)) : 0;
    questionStats.push({ questionId, n: vals.length, mean: m, sd, discrimination });
  }
  questionStats.sort((a, b) => b.discrimination - a.discrimination);

  return {
    configured: true,
    histograms,
    kdeByDimension,
    correlation,
    questionStats: questionStats.slice(0, 40),
    retestNote:
      'Re-test pairs are not stored in the current schema; internal consistency (e.g. Cronbach α) would require split-session design.',
  };
}

export type ComparePayload = {
  configured: boolean;
  western: DimensionConfidenceRow;
  ghana: DimensionConfidenceRow;
  nWestern: number;
  nGhana: number;
  tests: { dimension: CognitiveDimension; t: number; df: number; cohenD: number }[];
};

export async function fetchComparePayload(): Promise<ComparePayload> {
  const empty = emptyDimRow();
  const client = createResearchReadClient();
  if (!client) {
    return { configured: false, western: empty, ghana: empty, nWestern: 0, nGhana: 0, tests: [] };
  }

  const { data: profiles } = await client.from('profiles').select('cognitive_vector,cultural_context');
  const w: DimensionConfidenceRow[] = [];
  const g: DimensionConfidenceRow[] = [];
  for (const p of profiles ?? []) {
    const row = extractDimensionConfidencesFromProfileJson(p.cognitive_vector as Json);
    if (!row) continue;
    if (p.cultural_context === 'western') w.push(row);
    if (p.cultural_context === 'ghana') g.push(row);
  }

  const western = emptyDimRow();
  const ghana = emptyDimRow();
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    western[d] = w.length ? Math.round(mean(w.map((v) => v[d])) * 10) / 10 : 0;
    ghana[d] = g.length ? Math.round(mean(g.map((v) => v[d])) * 10) / 10 : 0;
  }

  const tests: ComparePayload['tests'] = [];
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    const a = w.map((v) => v[d]);
    const b = g.map((v) => v[d]);
    if (a.length < 2 || b.length < 2) {
      tests.push({ dimension: d, t: 0, df: a.length + b.length - 2, cohenD: 0 });
      continue;
    }
    const { t, df } = welchTTest(a, b);
    tests.push({ dimension: d, t, df, cohenD: cohenD(a, b) });
  }

  return { configured: true, western, ghana, nWestern: w.length, nGhana: g.length, tests };
}
