import { NextResponse } from 'next/server';

import { COGNITIVE_DIMENSION_KEYS } from '@/model/cognitive-dimensions';
import type { AssessmentSession } from '@/research/types';
import { aggregateStatsByContext, exportForR, exportForSPSS } from '@/research/study-export';

export const runtime = 'nodejs';

const HEADER_KEY = 'x-research-api-key';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

const CONTEXTS = new Set(['western', 'ghana', 'universal']);

function isAssessmentSession(x: unknown): x is AssessmentSession {
  if (!isRecord(x)) return false;
  if (typeof x.anonId !== 'string' || typeof x.culturalContext !== 'string') return false;
  if (!CONTEXTS.has(x.culturalContext)) return false;
  if (typeof x.completedAt !== 'string' || typeof x.responseCount !== 'number') return false;
  if (!isRecord(x.scores) || !isRecord(x.confidence)) return false;
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    if (typeof x.scores[d] !== 'number' || typeof x.confidence[d] !== 'number') return false;
  }
  return true;
}

/**
 * POST /api/research/export
 * Headers: `x-research-api-key` must match `RESEARCH_EXPORT_API_KEY`.
 * Body JSON: `{ "format": "spss" | "r", "sessions": AssessmentSession[] }`
 *
 * Returns CSV (spss) or JSON string payload (r) plus `Content-Disposition` for download.
 */
export async function POST(request: Request) {
  const expected = process.env.RESEARCH_EXPORT_API_KEY;
  if (!expected || expected.length < 16) {
    return NextResponse.json(
      { error: 'Research export is not configured (set RESEARCH_EXPORT_API_KEY to a strong secret).' },
      { status: 503 }
    );
  }

  const provided = request.headers.get(HEADER_KEY);
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 });
  }

  const format = body.format;
  if (format !== 'spss' && format !== 'r') {
    return NextResponse.json({ error: 'format must be "spss" or "r"' }, { status: 400 });
  }

  const rawSessions = body.sessions;
  if (!Array.isArray(rawSessions)) {
    return NextResponse.json({ error: 'sessions must be an array' }, { status: 400 });
  }

  const sessions = rawSessions.filter(isAssessmentSession);
  if (sessions.length !== rawSessions.length) {
    return NextResponse.json({ error: 'One or more session rows failed schema validation' }, { status: 400 });
  }

  const stats = aggregateStatsByContext(sessions);

  if (format === 'spss') {
    const csv = exportForSPSS(sessions);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="pcms_export.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }

  const rPayload = {
    ...(JSON.parse(exportForR(sessions)) as Record<string, unknown>),
    aggregates: stats,
  };
  return NextResponse.json(rPayload, {
    status: 200,
    headers: {
      'Content-Disposition': 'attachment; filename="pcms_export.json"',
      'Cache-Control': 'no-store',
    },
  });
}
