/**
 * Low-bandwidth / accessibility hints for UI (Ghana, metered data, reduced motion).
 */

export const PCMS_DATA_SAVER_KEY = 'pcms-data-saver';

type Conn = { saveData?: boolean };

export function getNetworkConnection(): Conn | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { connection?: Conn }).connection;
}

/** Browser “Data Saver” / user toggle. */
export function prefersDataSaver(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(PCMS_DATA_SAVER_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  const c = getNetworkConnection();
  return Boolean(c?.saveData);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Disable heavy chart motion when saving data or respecting OS accessibility. */
export function shouldReduceChartMotion(): boolean {
  return prefersReducedMotion() || prefersDataSaver();
}
