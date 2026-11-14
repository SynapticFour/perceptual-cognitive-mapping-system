import { NextResponse } from "next/server";
import { deleteRemoteSessionData } from "@/lib/session-deletion";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * GET /api/session/purge-expired
 * Vercel cron. Deletes sessions whose `data_retention_until` is in the past.
 * Requires `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("sessions")
    .select("id")
    .lt("data_retention_until", now)
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const ids = (data ?? []).map((row) => row.id);
  let deleted = 0;
  for (const id of ids) {
    const outcome = await deleteRemoteSessionData(id);
    if (outcome.status === "deleted") deleted += 1;
  }

  return NextResponse.json({ ok: true, scanned: ids.length, deleted });
}
