type CheckStatus = 'pass' | 'warn' | 'fail';

export interface HealthCheckRow {
  component: string;
  status: CheckStatus;
  details?: string;
}

export interface PublicSupabaseEnvStatus {
  configured: boolean;
  urlHost: string | null;
}

function resolvePublicSupabaseEnv(): { url: string; key: string } {
  const url =
    process.env['NEXT_PUBLIC_SUPABASE_URL']?.trim() ||
    process.env['SUPABASE_URL']?.trim() ||
    '';
  const key =
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']?.trim() ||
    process.env['SUPABASE_ANON_KEY']?.trim() ||
    '';
  return { url, key };
}

export function getPublicSupabaseEnvStatus(): PublicSupabaseEnvStatus {
  const { url, key } = resolvePublicSupabaseEnv();
  let urlHost: string | null = null;
  try {
    urlHost = url ? new URL(url).host : null;
  } catch {
    urlHost = null;
  }
  return {
    configured: !!(url && key),
    urlHost,
  };
}

export function getBuildMeta() {
  return {
    vercelEnv: process.env['VERCEL_ENV'] ?? null,
    targetEnv: process.env['VERCEL_TARGET_ENV'] ?? null,
    gitSha: process.env['VERCEL_GIT_COMMIT_SHA'] ?? null,
    runtime: 'nodejs',
  };
}

export function buildReadinessChecks(): HealthCheckRow[] {
  const supabase = getPublicSupabaseEnvStatus();
  return [
    { component: 'http', status: 'pass' },
    {
      component: 'supabase_public_env',
      status: supabase.configured ? 'pass' : 'warn',
      details: supabase.configured
        ? `configured (${supabase.urlHost ?? 'unknown-host'})`
        : 'missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY (cloud writes disabled; local-only mode still works)',
    },
  ];
}
