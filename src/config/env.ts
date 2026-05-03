/**
 * Typed Next.js public env access. Server and client code should import from here only.
 */

function readPublic(name: string): string | undefined {
  const v = process.env[name];
  if (v === undefined || v === '') return undefined;
  return v.trim() === '' ? undefined : v;
}

/** Supabase optional: when unset, app uses local persistence only. */
export function getSupabaseUrl(): string | undefined {
  return readPublic('NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string | undefined {
  return readPublic('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export function isSupabaseEnvConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return !!(url && key);
}

/** Public site URL for absolute links (optional). Example production: https://map.synapticfour.com */
export function getPublicAppUrl(): string | undefined {
  return readPublic('NEXT_PUBLIC_APP_URL');
}

/** When `1`, shows a compact operator bar with cloud env + last write telemetry (browser-only). */
export function showOperatorSyncDiagnostic(): boolean {
  return readPublic('NEXT_PUBLIC_PCMS_SHOW_OPERATOR_SYNC_DIAGNOSTIC') === '1';
}
