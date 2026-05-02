import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { getSupabaseServiceRoleKey } from '@/config/env-server';
import { getSupabaseUrl } from '@/config/env';

export type PcmsSupabaseAdmin = SupabaseClient<Database>;

let adminClient: PcmsSupabaseAdmin | null = null;

/**
 * Returns a Supabase client using the service role key (server routes only).
 * URL is taken from NEXT_PUBLIC_SUPABASE_URL.
 */
export function getSupabaseAdminClient(): PcmsSupabaseAdmin | null {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return null;

  if (!adminClient) {
    adminClient = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}
