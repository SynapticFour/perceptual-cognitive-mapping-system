import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import { isUuidString } from '@/lib/atlas-self-nomination-persist';

export const runtime = 'nodejs';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/**
 * POST /api/atlas/self-nomination
 * Body: anonymousId (UUID), locale, selectedDescriptorIds (string[]), optional linkedPcmsSessionId (UUID), explicitNone, skipped
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const anonymousId = typeof body.anonymousId === 'string' ? body.anonymousId.trim() : '';
  const locale = typeof body.locale === 'string' ? body.locale.trim().slice(0, 32) : '';
  const selected = Array.isArray(body.selectedDescriptorIds)
    ? body.selectedDescriptorIds.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length < 200)
    : [];
  const linked =
    typeof body.linkedPcmsSessionId === 'string' && isUuidString(body.linkedPcmsSessionId)
      ? body.linkedPcmsSessionId.trim()
      : null;

  if (!isUuidString(anonymousId)) {
    return NextResponse.json({ error: 'anonymousId must be a UUID' }, { status: 400 });
  }
  if (!locale) {
    return NextResponse.json({ error: 'locale is required' }, { status: 400 });
  }
  if (selected.length > 80) {
    return NextResponse.json({ error: 'Too many descriptors' }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, skippedRemote: true, reason: 'no_service_role' });
  }

  const { error } = await admin.from('atlas_self_nominations').insert({
    anonymous_id: anonymousId,
    locale,
    selected_descriptor_ids: selected,
    linked_pcms_session_id: linked,
    linked_atlas_session_id: null,
  });

  if (error) {
    console.error('[atlas_self_nominations] insert failed', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, skippedRemote: false });
}
