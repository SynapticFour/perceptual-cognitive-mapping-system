import { getSupabaseAdminClient } from '@/lib/supabase-admin';

export type DeleteSessionOutcome =
  | { status: 'deleted'; sessionId: string }
  | { status: 'skipped_no_server'; sessionId: string }
  | { status: 'error'; sessionId: string; message: string };

/**
 * Deletes all rows tied to a session id in Supabase (requires service role).
 */
export async function deleteRemoteSessionData(sessionId: string): Promise<DeleteSessionOutcome> {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return { status: 'skipped_no_server', sessionId };
  }

  try {
    await admin.from('research_assessments').delete().eq('session_id', sessionId);
    await admin.from('question_responses').delete().eq('session_id', sessionId);
    await admin.from('profiles').delete().eq('session_id', sessionId);
    await admin.from('data_processing_records').delete().eq('session_id', sessionId);
    await admin.from('sessions').delete().eq('id', sessionId);
    return { status: 'deleted', sessionId };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { status: 'error', sessionId, message };
  }
}
