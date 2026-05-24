import { NextResponse } from 'next/server';
import { getBuildMeta, getPublicSupabaseEnvStatus } from '@/lib/health-checks';
import { probeSupabaseConnectivity } from '@/lib/supabase-health-probe';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Reachability probe for configured Supabase (REST + Postgres path).
 * Safe for cron/keep-alive: no secrets in the response.
 */
export async function GET() {
  const env = getPublicSupabaseEnvStatus();
  const meta = getBuildMeta();

  if (!env.configured) {
    return NextResponse.json({
      status: 'warn',
      service: 'pcms',
      probe: 'supabase',
      configured: false,
      urlHost: env.urlHost,
      details: 'Supabase public env not configured (local-only mode)',
      timestamp: new Date().toISOString(),
      version: meta.gitSha,
      vercelEnv: meta.vercelEnv,
    });
  }

  const result = await probeSupabaseConnectivity();
  const status = result.status === 'pass' ? 'pass' : result.status === 'skipped' ? 'warn' : 'fail';

  return NextResponse.json(
    {
      status,
      service: 'pcms',
      probe: 'supabase',
      configured: true,
      urlHost: env.urlHost,
      reachable: result.status === 'pass',
      latencyMs: result.latencyMs ?? null,
      httpStatus: result.httpStatus ?? null,
      error: result.error ?? null,
      timestamp: new Date().toISOString(),
      version: meta.gitSha,
      vercelEnv: meta.vercelEnv,
    },
    { status: status === 'fail' ? 503 : 200 }
  );
}
