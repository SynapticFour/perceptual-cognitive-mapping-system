/** localStorage key for last remote write outcome (operator / diagnostic UI). */
export const CLOUD_SYNC_TELEMETRY_KEY = 'pcms-cloud-sync-telemetry-v1';

export type CloudSyncTelemetry = {
  at: string;
  ok: boolean;
  context: string;
};

export function readCloudSyncTelemetry(): CloudSyncTelemetry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_TELEMETRY_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<CloudSyncTelemetry>;
    if (typeof o.at !== 'string' || typeof o.ok !== 'boolean' || typeof o.context !== 'string') return null;
    return { at: o.at, ok: o.ok, context: o.context };
  } catch {
    return null;
  }
}

/** Records the outcome of the latest Supabase write attempt (overwrites previous). */
export function recordCloudSyncAttempt(context: string, ok: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CloudSyncTelemetry = {
      at: new Date().toISOString(),
      ok,
      context,
    };
    localStorage.setItem(CLOUD_SYNC_TELEMETRY_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('pcms-cloud-sync-telemetry'));
  } catch {
    /* ignore quota / private mode */
  }
}
