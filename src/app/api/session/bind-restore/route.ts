import { NextResponse } from "next/server";
import { isUuidString } from "@/lib/atlas-self-nomination-persist";
import { createRateLimitMiddleware, restoreApiLimiter } from "@/lib/rate-limiter";
import { bindRestoreSecretHash } from "@/lib/session-restore";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

/**
 * POST /api/session/bind-restore
 * Body: `{ "sessionId", "restoreSecretHash" }`. The secret itself is not accepted.
 */
export async function POST(request: Request) {
  const limited = createRateLimitMiddleware(restoreApiLimiter)(request);
  if (limited instanceof Response) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (
    !isRecord(body) ||
    typeof body.sessionId !== "string" ||
    typeof body.restoreSecretHash !== "string"
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!isUuidString(body.sessionId)) {
    return NextResponse.json({ error: "invalid_session" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const outcome = await bindRestoreSecretHash(
    admin,
    body.sessionId.trim(),
    body.restoreSecretHash.trim(),
  );
  if (outcome === "invalid") return NextResponse.json({ error: "invalid_hash" }, { status: 400 });
  if (outcome === "missing") return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (outcome === "conflict") return NextResponse.json({ error: "conflict" }, { status: 409 });
  return NextResponse.json({ ok: true, status: outcome });
}
