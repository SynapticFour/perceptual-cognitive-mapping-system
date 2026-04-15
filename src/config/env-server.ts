/** Server-only env (do not import from client components). */

function readSecret(name: string): string | undefined {
  const v = process.env[name];
  if (v === undefined || v.trim() === '') return undefined;
  return v.trim();
}

/** Service role key for GDPR deletion and audit inserts (bypasses RLS). Optional. */
export function getSupabaseServiceRoleKey(): string | undefined {
  return readSecret('SUPABASE_SERVICE_ROLE_KEY');
}
