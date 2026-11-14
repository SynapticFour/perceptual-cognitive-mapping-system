import { NextResponse } from "next/server";
import { createRateLimitMiddleware, restoreApiLimiter } from "@/lib/rate-limiter";
import { deleteSessionBySecret } from "@/lib/session-restore";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

/**
 * POST /api/delete-session
 * Body: `{ "secret": "<restore secret>" }`. The secret is not logged.
 * Deletes every row of the matching session.
 */
export async function POST(request: Request) {
  const limited = createRateLimitMiddleware(restoreApiLimiter)(request);
  if (limited instanceof Response) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.secret !== "string" || body.secret.trim().length < 22) {
    return NextResponse.json({ error: "secret is required" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({
      ok: true,
      deletedRemote: false,
      message:
        "No Supabase service role configured; remote data was not deleted. Clear local data in the browser.",
    });
  }

  const outcome = await deleteSessionBySecret(admin, body.secret.trim());
  if (outcome.status === "rejected") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    deletedRemote: true,
    sessionId: outcome.sessionId,
    message: "Server-side session data was deleted.",
  });
}
