import { NextResponse } from 'next/server';
import { getBuildMeta, getPublicSupabaseEnvStatus } from '@/lib/health-checks';

export const dynamic = 'force-dynamic';

/**
 * Diagnostics only (no secrets): confirms whether server-side env resolves Supabase URL + anon key.
 * Uses bracket access so bundlers do not strip lookups when NEXT_PUBLIC vars were absent at compile time.
 */
export async function GET() {
  const supabase = getPublicSupabaseEnvStatus();
  const meta = getBuildMeta();

  return NextResponse.json({
    configured: supabase.configured,
    urlHost: supabase.urlHost,
    vercelEnv: meta.vercelEnv,
    targetEnv: meta.targetEnv,
    gitSha: meta.gitSha,
  });
}
