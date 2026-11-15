import { NextResponse } from "next/server";
import { createRateLimitMiddleware, restoreApiLimiter } from "@/lib/rate-limiter";
import { loadSessionBySecret } from "@/lib/session-restore";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

/**
 * POST /api/session/restore
 * Body: `{ "secret": "<restore secret>" }`. The secret is not logged.
 * Returns only the session whose stored hash matches.
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
  if (!isRecord(body) || typeof body.secret !== "string" || body.secret.trim().length < 22) {
    return NextResponse.json({ error: "secret_required" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    const restored = await loadSessionBySecret(admin, body.secret.trim());
    if (!restored) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(restored, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
