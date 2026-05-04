import { putAtlasSelfNominationRow } from '@/lib/offline-storage';

/** UUID v4-style (accepts any hex variant nibble for compatibility with stored session ids). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidString(s: string | undefined | null): s is string {
  return typeof s === 'string' && UUID_RE.test(s.trim());
}

export type PersistSelfNominationInput = {
  locale: string;
  browserSessionKey: string;
  linkedPcmsSessionId?: string | null;
  selectedDescriptorIds: string[];
  explicitNone: boolean;
};

/**
 * Persists self-nomination to IndexedDB and optionally Supabase (server route).
 * Never throws — failures are logged and returned in `serverOk`.
 */
export async function persistSelfNomination(input: PersistSelfNominationInput): Promise<{
  serverOk: boolean;
  serverError?: string;
}> {
  const completedAt = new Date().toISOString();
  await putAtlasSelfNominationRow({
    sessionId: input.browserSessionKey,
    locale: input.locale,
    selectedDescriptorIds: input.selectedDescriptorIds,
    explicitNone: input.explicitNone,
    skipped: false,
    completedAt,
  });

  const anonymousId = isUuidString(input.browserSessionKey)
    ? input.browserSessionKey.trim()
    : crypto.randomUUID();

  const linked =
    input.linkedPcmsSessionId && isUuidString(input.linkedPcmsSessionId)
      ? input.linkedPcmsSessionId.trim()
      : null;

  try {
    const res = await fetch('/api/atlas/self-nomination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymousId,
        locale: input.locale,
        selectedDescriptorIds: input.selectedDescriptorIds,
        linkedPcmsSessionId: linked,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      return { serverOk: false, serverError: j.error ?? res.statusText };
    }
    return { serverOk: true };
  } catch (e) {
    return { serverOk: false, serverError: e instanceof Error ? e.message : 'network' };
  }
}
