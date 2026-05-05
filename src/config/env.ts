/**
 * Typed Next.js public env access. Server and client code should import from here only.
 */

import { FEATURE_FLAGS } from '@/config/feature-flags';

function trimNonEmpty(value: string | undefined): string | undefined {
  if (value === undefined || value === '') return undefined;
  const t = value.trim();
  return t === '' ? undefined : t;
}

/**
 * Supabase optional: when unset, app uses local persistence only.
 *
 * Use direct `process.env.NEXT_PUBLIC_*` property access (not `process.env[name]`).
 * Next.js only inlines public env vars for static member access; dynamic lookups stay
 * empty in the browser bundle and break cloud detection even when Vercel has the vars.
 */
export function getSupabaseUrl(): string | undefined {
  return trimNonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string | undefined {
  return trimNonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isSupabaseEnvConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return !!(url && key);
}

/** Public site URL for absolute links (optional). Example production: https://map.synapticfour.com */
export function getPublicAppUrl(): string | undefined {
  return trimNonEmpty(process.env.NEXT_PUBLIC_APP_URL);
}

/** When `1`, shows a compact operator bar with cloud env + last write telemetry (browser-only). */
export function showOperatorSyncDiagnostic(): boolean {
  return trimNonEmpty(process.env.NEXT_PUBLIC_PCMS_SHOW_OPERATOR_SYNC_DIAGNOSTIC) === '1';
}

/** When `true`, shows a validation-status banner on `/research/*` linking to docs/VALIDATION_PROTOCOL.md. */
export function showValidationStatusBanner(): boolean {
  return FEATURE_FLAGS.VALIDATION_STATUS_BANNER;
}
