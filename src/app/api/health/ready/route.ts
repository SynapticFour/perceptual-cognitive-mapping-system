import { NextResponse } from 'next/server';
import { buildReadinessChecks, getBuildMeta } from '@/lib/health-checks';

/** Readiness probe: verifies critical runtime config for serving traffic. */
export function GET() {
  const checks = buildReadinessChecks();
  const hasFail = checks.some((c) => c.status === 'fail');
  const hasWarn = checks.some((c) => c.status === 'warn');
  const status = hasFail ? 'fail' : hasWarn ? 'warn' : 'pass';
  const meta = getBuildMeta();

  return NextResponse.json(
    {
      status,
      service: 'pcms',
      probe: 'ready',
      checks,
      timestamp: new Date().toISOString(),
      version: meta.gitSha,
      vercelEnv: meta.vercelEnv,
    },
    { status: hasFail ? 503 : 200 }
  );
}
