import { NextResponse } from 'next/server';

import { COGNITIVE_DIMENSION_KEYS } from '@/model/cognitive-dimensions';
import { createResearchReadClient } from '@/lib/research-data';
import {
  extractDimensionConfidencesFromProfileJson,
  overallInterpretationConfidence,
} from '@/lib/research-pipeline-extract';
import { isResearchAuthedFromRequest } from '@/lib/research-auth';
import type { Json } from '@/types/database.types';

export const runtime = 'nodejs';

function csvEscape(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return '';
  const t = String(s);
  if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

export async function GET(request: Request) {
  if (!(await isResearchAuthedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') === 'json' ? 'json' : 'csv';

  const client = createResearchReadClient();
  if (!client) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data, error } = await client
    .from('profiles')
    .select('id,created_at,cultural_context,response_count,completion_time_seconds,cognitive_vector')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'query_failed' }, { status: 500 });
  }

  const rows = data.map((p) => {
    const dims = extractDimensionConfidencesFromProfileJson(p.cognitive_vector as Json);
    const base = {
      anon_id: `p_${String(p.id).slice(0, 8)}`,
      created_at: p.created_at,
      cultural_context: p.cultural_context,
      response_count: p.response_count,
      completion_time_seconds: p.completion_time_seconds,
      interpretation_confidence: overallInterpretationConfidence(p.cognitive_vector as Json),
    };
    const dimObj: Record<string, number | null> = {};
    for (const d of COGNITIVE_DIMENSION_KEYS) {
      dimObj[`dim_${d}_confidence_pct`] = dims ? dims[d] : null;
    }
    return { ...base, ...dimObj };
  });

  if (format === 'json') {
    return NextResponse.json(rows, {
      headers: {
        'Content-Disposition': 'attachment; filename="pcms_research_profiles.json"',
        'Cache-Control': 'no-store',
      },
    });
  }

  const headers = [
    'anon_id',
    'created_at',
    'cultural_context',
    'response_count',
    'completion_time_seconds',
    'interpretation_confidence',
    ...COGNITIVE_DIMENSION_KEYS.map((d) => `dim_${d}_confidence_pct`),
  ];
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => csvEscape((r as Record<string, unknown>)[h] as never)).join(',')),
  ];
  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pcms_research_profiles.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
