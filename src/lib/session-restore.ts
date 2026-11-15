import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  DUMMY_RESTORE_HASH,
  hashRestoreSecret,
  isRestoreSecretHash,
  timingSafeEqualHex,
} from "@/lib/restore-secret";
import { deleteRemoteSessionData } from "@/lib/session-deletion";

export type SessionRestoreAdmin = SupabaseClient<Database>;

export type RestoredSession = {
  session: Record<string, unknown>;
  questionResponses: Record<string, unknown>[];
  profile: Record<string, unknown> | null;
  pipelineFinalProfile: unknown;
};

const SESSION_FIELDS =
  "id, cultural_context, completion_status, consent_timestamp, completed_at, assessment_version, question_path, duration_ms, created_at, data_retention_until";

function omitSecret(row: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...row };
  delete copy.restore_secret_hash;
  delete copy.ip_hash;
  delete copy.consent_ip_hash;
  delete copy.user_agent;
  return copy;
}

export async function findSessionIdBySecret(
  admin: SessionRestoreAdmin,
  secret: string,
): Promise<string | null> {
  const hash = await hashRestoreSecret(secret);
  const { data, error } = await admin
    .from("sessions")
    .select("id, restore_secret_hash")
    .eq("restore_secret_hash", hash)
    .maybeSingle();
  const stored =
    !error && data?.restore_secret_hash ? data.restore_secret_hash : DUMMY_RESTORE_HASH;
  if (!timingSafeEqualHex(stored, hash) || !data || error) return null;
  return data.id;
}

export async function loadSessionBySecret(
  admin: SessionRestoreAdmin,
  secret: string,
): Promise<RestoredSession | null> {
  const sessionId = await findSessionIdBySecret(admin, secret);
  if (!sessionId) return null;

  const [sessionRes, responseRes, profileRes, pipelineRes] = await Promise.all([
    admin.from("sessions").select(SESSION_FIELDS).eq("id", sessionId).maybeSingle(),
    admin.from("question_responses").select("*").eq("session_id", sessionId),
    admin.from("profiles").select("*").eq("session_id", sessionId).maybeSingle(),
    admin
      .from("pipeline_sessions")
      .select("final_profile")
      .eq("session_id", sessionId)
      .maybeSingle(),
  ]);

  if (sessionRes.error || !sessionRes.data) return null;
  if (sessionRes.data.id !== sessionId) return null;

  return {
    session: omitSecret(sessionRes.data as Record<string, unknown>),
    questionResponses: (responseRes.data ?? []) as Record<string, unknown>[],
    profile: profileRes.data ? omitSecret(profileRes.data as Record<string, unknown>) : null,
    pipelineFinalProfile: pipelineRes.data?.final_profile ?? null,
  };
}

export async function deleteSessionBySecret(
  admin: SessionRestoreAdmin,
  secret: string,
): Promise<{ status: "deleted"; sessionId: string } | { status: "rejected" }> {
  const sessionId = await findSessionIdBySecret(admin, secret);
  if (!sessionId) return { status: "rejected" };
  const outcome = await deleteRemoteSessionData(sessionId);
  if (outcome.status !== "deleted") return { status: "rejected" };
  return { status: "deleted", sessionId };
}

export async function bindRestoreSecretHash(
  admin: SessionRestoreAdmin,
  sessionId: string,
  restoreSecretHash: string,
): Promise<"bound" | "exists" | "missing" | "conflict" | "invalid"> {
  if (!isRestoreSecretHash(restoreSecretHash)) return "invalid";
  const { data, error } = await admin
    .from("sessions")
    .select("id, restore_secret_hash, data_retention_until")
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !data) return "missing";
  if (data.restore_secret_hash) {
    if (!timingSafeEqualHex(data.restore_secret_hash, restoreSecretHash)) return "conflict";
    return "exists";
  }
  const until =
    data.data_retention_until ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const { error: updateError } = await admin
    .from("sessions")
    .update({ restore_secret_hash: restoreSecretHash, data_retention_until: until })
    .eq("id", sessionId);
  if (updateError) return "invalid";
  return "bound";
}
