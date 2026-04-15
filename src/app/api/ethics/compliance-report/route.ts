import { NextResponse } from 'next/server';
import { generateEthicsComplianceReport } from '@/lib/ethics-audit';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const HEADER_KEY = 'x-research-api-key';

/**
 * GET /api/ethics/compliance-report
 * Header `x-research-api-key` must match `RESEARCH_EXPORT_API_KEY` (same governance as research export).
 * Returns aggregated ethics events from Supabase (when configured) plus browser-log summary shape.
 */
export async function GET(request: Request) {
  const expected = process.env.RESEARCH_EXPORT_API_KEY;
  if (!expected || expected.length < 16) {
    return NextResponse.json(
      { error: 'Compliance reporting is not configured (set RESEARCH_EXPORT_API_KEY).' },
      { status: 503 }
    );
  }

  const key = request.headers.get(HEADER_KEY);
  if (key !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const localShape = generateEthicsComplianceReport({ windowDays: 365 });

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      source: 'local_only',
      localBrowserLogTemplate: localShape,
      server: null,
    });
  }

  const { data, error } = await admin
    .from('ethics_audit_events')
    .select('event_type, created_at, session_id')
    .gte('created_at', new Date(Date.now() - 365 * 864e5).toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const t = row.event_type as string;
    counts[t] = (counts[t] ?? 0) + 1;
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    source: 'supabase',
    windowDays: 365,
    serverEventCounts: counts,
    serverEventsSampled: rows.length,
    localBrowserLogTemplate: localShape,
  });
}
