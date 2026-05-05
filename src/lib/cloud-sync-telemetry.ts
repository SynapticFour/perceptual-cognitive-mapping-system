/** localStorage key for last remote write outcome (operator / diagnostic UI). */
export const CLOUD_SYNC_TELEMETRY_KEY = 'pcms-cloud-sync-telemetry-v1';
/** localStorage key for rolling history of remote write outcomes. */
export const CLOUD_SYNC_TELEMETRY_HISTORY_KEY = 'pcms-cloud-sync-telemetry-history-v1';
const CLOUD_SYNC_HISTORY_LIMIT = 20;

export type CloudSyncTelemetry = {
  at: string;
  ok: boolean;
  context: string;
  errorCode?: string;
  errorMessage?: string;
};

export function readCloudSyncTelemetry(): CloudSyncTelemetry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_TELEMETRY_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<CloudSyncTelemetry>;
    if (typeof o.at !== 'string' || typeof o.ok !== 'boolean' || typeof o.context !== 'string') return null;
    return {
      at: o.at,
      ok: o.ok,
      context: o.context,
      errorCode: typeof o.errorCode === 'string' ? o.errorCode : undefined,
      errorMessage: typeof o.errorMessage === 'string' ? o.errorMessage : undefined,
    };
  } catch {
    return null;
  }
}

export function readCloudSyncTelemetryHistory(): CloudSyncTelemetry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_TELEMETRY_HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Partial<CloudSyncTelemetry>[];
    if (!Array.isArray(arr)) return [];
    return arr
      .map((o) => {
        if (typeof o.at !== 'string' || typeof o.ok !== 'boolean' || typeof o.context !== 'string') return null;
        return {
          at: o.at,
          ok: o.ok,
          context: o.context,
          errorCode: typeof o.errorCode === 'string' ? o.errorCode : undefined,
          errorMessage: typeof o.errorMessage === 'string' ? o.errorMessage : undefined,
        } as CloudSyncTelemetry;
      })
      .filter((x): x is CloudSyncTelemetry => !!x);
  } catch {
    return [];
  }
}

function normalizeErrorDetails(details?: { errorCode?: string; errorMessage?: string }): {
  errorCode?: string;
  errorMessage?: string;
} {
  const out: { errorCode?: string; errorMessage?: string } = {};
  if (details?.errorCode && details.errorCode.trim()) out.errorCode = details.errorCode.trim().slice(0, 80);
  if (details?.errorMessage && details.errorMessage.trim()) {
    out.errorMessage = details.errorMessage.trim().slice(0, 280);
  }
  return out;
}

/** Best-effort extraction of error code/message from unknown thrown/input payloads. */
export function extractCloudErrorDetails(err: unknown): { errorCode?: string; errorMessage?: string } {
  if (!err) return {};
  if (typeof err === 'string') return { errorMessage: err };
  if (err instanceof Error) {
    const withCode = err as Error & { code?: string };
    return { errorCode: withCode.code, errorMessage: err.message };
  }
  if (typeof err === 'object' && err !== null) {
    const anyErr = err as { code?: unknown; message?: unknown; error_description?: unknown };
    return {
      errorCode: typeof anyErr.code === 'string' ? anyErr.code : undefined,
      errorMessage:
        typeof anyErr.message === 'string'
          ? anyErr.message
          : typeof anyErr.error_description === 'string'
            ? anyErr.error_description
            : undefined,
    };
  }
  return {};
}

/** Records Supabase write attempt outcome (latest + rolling history). */
export function recordCloudSyncAttempt(
  context: string,
  ok: boolean,
  details?: { errorCode?: string; errorMessage?: string }
): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = normalizeErrorDetails(details);
    const payload: CloudSyncTelemetry = {
      at: new Date().toISOString(),
      ok,
      context,
      ...normalized,
    };
    localStorage.setItem(CLOUD_SYNC_TELEMETRY_KEY, JSON.stringify(payload));
    const history = readCloudSyncTelemetryHistory();
    history.push(payload);
    const trimmed = history.slice(-CLOUD_SYNC_HISTORY_LIMIT);
    localStorage.setItem(CLOUD_SYNC_TELEMETRY_HISTORY_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent('pcms-cloud-sync-telemetry'));
  } catch {
    /* ignore quota / private mode */
  }
}
