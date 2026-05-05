import { isSupabaseConfigured } from '@/lib/supabase';

export const PCMS_CLOUD_SYNC_OPT_IN_KEY = 'pcms-cloud-sync-opt-in-v1';

export function hasCloudResearchConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PCMS_CLOUD_SYNC_OPT_IN_KEY) === '1';
}

export function setCloudResearchConsent(optIn: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PCMS_CLOUD_SYNC_OPT_IN_KEY, optIn ? '1' : '0');
}

/** True only when env is configured and participant explicitly opted in. */
export function isCloudResearchStorageEnabled(): boolean {
  return isSupabaseConfigured() && hasCloudResearchConsent();
}
