import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Diagnostics only (no secrets): confirms whether server-side env resolves Supabase URL + anon key.
 * Uses bracket access so bundlers do not strip lookups when NEXT_PUBLIC vars were absent at compile time.
 */
export async function GET() {
  const url =
    process.env['NEXT_PUBLIC_SUPABASE_URL']?.trim() ||
    process.env['SUPABASE_URL']?.trim() ||
    '';
  const key =
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']?.trim() ||
    process.env['SUPABASE_ANON_KEY']?.trim() ||
    '';

  let urlHost: string | null = null;
  try {
    urlHost = url ? new URL(url).host : null;
  } catch {
    urlHost = null;
  }

  return NextResponse.json({
    configured: !!(url && key),
    urlHost,
    vercelEnv: process.env['VERCEL_ENV'] ?? null,
  });
}
