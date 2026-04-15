import { NextResponse } from 'next/server';
import { ethicsEventToJsonPayload, type EthicsAuditEvent, type EthicsAuditEventType } from '@/lib/ethics-audit';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const EVENT_TYPES = new Set<EthicsAuditEventType>([
  'consent_step_completed',
  'consent_flow_completed',
  'results_assent_completed',
  'data_deletion_requested',
  'data_deletion_completed',
  'data_deletion_failed',
]);

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/** POST /api/ethics-audit — best-effort mirror of client-side ethics log (requires service role). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.type !== 'string' || !EVENT_TYPES.has(body.type as EthicsAuditEventType)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, stored: false });
  }

  const event: EthicsAuditEvent = {
    type: body.type as EthicsAuditEventType,
    timestamp: typeof body.timestamp === 'string' ? body.timestamp : new Date().toISOString(),
    stepId: typeof body.stepId === 'string' ? body.stepId : undefined,
    sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
    meta: isRecord(body.meta) ? (body.meta as Record<string, unknown>) : undefined,
  };

  const { error } = await admin.from('ethics_audit_events').insert({
    event_type: event.type,
    session_id: event.sessionId ?? null,
    payload: ethicsEventToJsonPayload(event),
  });

  if (error) {
    console.error('ethics-audit POST', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stored: true });
}
