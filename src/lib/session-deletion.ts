import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type DeleteSessionOutcome =
  | { status: "deleted"; sessionId: string }
  | { status: "skipped_no_server"; sessionId: string }
  | { status: "error"; sessionId: string; message: string };

type LooseDelete = {
  from: (table: string) => {
    delete: () => { eq: (column: string, value: string) => Promise<unknown> };
  };
};

/**
 * Deletes every stored row tied to one session id (requires service role).
 * Child tables go first. `sessions` is last because other tables reference it.
 */
export async function deleteRemoteSessionData(sessionId: string): Promise<DeleteSessionOutcome> {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return { status: "skipped_no_server", sessionId };
  }

  const db = admin as unknown as LooseDelete;

  try {
    await db.from("research_assessments").delete().eq("session_id", sessionId);
    await db.from("question_responses").delete().eq("session_id", sessionId);
    await db.from("profiles").delete().eq("session_id", sessionId);
    await db.from("pipeline_sessions").delete().eq("session_id", sessionId);
    await db.from("data_processing_records").delete().eq("session_id", sessionId);
    await db.from("ethics_audit_events").delete().eq("session_id", sessionId);
    await db.from("atlas_self_nominations").delete().eq("linked_pcms_session_id", sessionId);
    await db.from("atlas_sessions").delete().eq("anonymous_id", sessionId);
    await db.from("data_subject_requests").delete().eq("session_identifier", sessionId);
    await db.from("audit_log").delete().eq("record_id", sessionId);
    await db.from("sessions").delete().eq("id", sessionId);
    return { status: "deleted", sessionId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { status: "error", sessionId, message };
  }
}
