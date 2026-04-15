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
