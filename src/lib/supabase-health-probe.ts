import { getSupabaseAnonKey, getSupabaseUrl } from '@/config/env';

const PROBE_TIMEOUT_MS = 12_000;

export type SupabaseProbeStatus = 'pass' | 'fail' | 'skipped';

export interface SupabaseConnectivityProbe {
  status: SupabaseProbeStatus;
  configured: boolean;
  latencyMs?: number;
  httpStatus?: number;
  /** Safe for logs/diagnostics — no secrets. */
  error?: string;
}

/**
 * Lightweight REST probe: counts as Supabase API activity (free-tier keep-alive)
 * and confirms Postgres/PostgREST is reachable, not only env vars.
 */
export async function probeSupabaseConnectivity(): Promise<SupabaseConnectivityProbe> {
  const url = getSupabaseUrl()?.replace(/\/$/, '');
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    return { status: 'skipped', configured: false };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(`${url}/rest/v1/sessions?select=id&limit=1`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    const latencyMs = Date.now() - started;
    if (response.ok) {
      return { status: 'pass', configured: true, latencyMs, httpStatus: response.status };
    }

    return {
      status: 'fail',
      configured: true,
      latencyMs,
      httpStatus: response.status,
      error: `rest probe HTTP ${response.status}`,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === 'AbortError'
          ? `probe timed out after ${PROBE_TIMEOUT_MS}ms`
          : error.message
        : 'probe failed';
    return {
      status: 'fail',
      configured: true,
      latencyMs: Date.now() - started,
      error: message,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
