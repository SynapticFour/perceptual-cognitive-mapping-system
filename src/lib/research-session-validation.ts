import type { StoredPipelineSession } from '@/types/pipeline-session';

/**
 * **Authoritative research record:** `StoredPipelineSession` (and `full-session.json` exports) —
 * not share URLs, not `LandscapeSharePayload`.
 */
export type ResearchRecordField = 'questionBankId' | 'bankVersion' | 'stemRegionUsed' | 'adaptiveMode';

/** Returns missing field names (empty string counts as missing). */
export function researchRecordMissingFields(session: StoredPipelineSession): ResearchRecordField[] {
  const missing: ResearchRecordField[] = [];
  if (!session.questionBankId?.trim()) missing.push('questionBankId');
  if (!session.bankVersion?.trim()) missing.push('bankVersion');
  if (!session.stemRegionUsed) missing.push('stemRegionUsed');
  if (!session.adaptiveMode) missing.push('adaptiveMode');
  return missing;
}

export function warnIfResearchRecordIncomplete(
  session: StoredPipelineSession,
  context: string
): void {
  const missing = researchRecordMissingFields(session);
  if (missing.length === 0) return;
  const suppress =
    process.env.VITEST === 'true' ||
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_PUBLIC_PCMS_SUPPRESS_RESEARCH_RECORD_WARN === '1';
  if (suppress || typeof console === 'undefined') return;
  console.warn(
    `[PCMS] Research record incomplete (${context}): missing ${missing.join(', ')} — reproducibility may be impaired.`
  );
}
