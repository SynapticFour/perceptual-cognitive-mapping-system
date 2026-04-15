import { NextResponse } from 'next/server';
import { ethicsEventToJsonPayload, type EthicsAuditEvent } from '@/lib/ethics-audit';
import { deleteRemoteSessionData } from '@/lib/session-deletion';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

async function insertServerAudit(event: EthicsAuditEvent) {
  const admin = getSupabaseAdminClient();
  if (!admin) return;
  const stamped: EthicsAuditEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };
  const { error } = await admin.from('ethics_audit_events').insert({
    event_type: stamped.type,
    session_id: stamped.sessionId ?? null,
    payload: ethicsEventToJsonPayload({
      ...stamped,
      meta: { ...(stamped.meta ?? {}), source: 'server' },
    }),
  });
  if (error) {
    console.error('ethics_audit_events insert failed', error);
  }
}

/**
 * POST /api/delete-session
 * Body: `{ "sessionId": "<uuid>" }`
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.sessionId !== 'string' || body.sessionId.length < 8) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const sessionId = body.sessionId.trim();

  await insertServerAudit({
    type: 'data_deletion_requested',
    sessionId,
    meta: { route: '/api/delete-session' },
  });

  const outcome = await deleteRemoteSessionData(sessionId);

  if (outcome.status === 'deleted') {
    await insertServerAudit({
      type: 'data_deletion_completed',
      sessionId,
      meta: { deletedRemote: true },
    });
    return NextResponse.json({
      ok: true,
      deletedRemote: true,
      sessionId,
      message: 'Server-side session data was deleted.',
    });
  }

  if (outcome.status === 'skipped_no_server') {
    await insertServerAudit({
      type: 'data_deletion_completed',
      sessionId,
      meta: { deletedRemote: false, reason: 'no_service_role' },
    });
    return NextResponse.json({
      ok: true,
      deletedRemote: false,
      sessionId,
      message: 'No Supabase service role configured; remote data was not deleted. Clear local data in the browser.',
    });
  }

  await insertServerAudit({
    type: 'data_deletion_failed',
    sessionId,
    meta: { error: outcome.message },
  });

  return NextResponse.json(
    {
      ok: false,
      error: outcome.message,
      sessionId: outcome.sessionId,
    },
    { status: 500 }
  );
}
