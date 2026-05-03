import { describe, it, expect } from 'vitest';
import { computeProfileAdaptiveSnapshot, toProfileAdaptiveSessionSummary } from '@/adaptive';
import { parseStoredPipelineSession } from '@/lib/parse-pipeline-session';
import { PIPELINE_STORAGE_VERSION } from '@/types/pipeline-session';
import { sampleStoredSession } from '../../../e2e/fixtures/results-session';

describe('parseStoredPipelineSession', () => {
  it('returns null for invalid payloads', () => {
    expect(parseStoredPipelineSession(null)).toBeNull();
    expect(parseStoredPipelineSession({})).toBeNull();
    expect(parseStoredPipelineSession({ version: PIPELINE_STORAGE_VERSION })).toBeNull();
  });

  it('accepts optional profile stem and bank meta', () => {
    const summary = toProfileAdaptiveSessionSummary(computeProfileAdaptiveSnapshot([], new Map()));
    const raw = {
      ...sampleStoredSession,
      profileAdaptiveSummary: summary,
      stemRegionUsed: 'west_africa',
      questionBankId: 'cultural-adaptive-v1',
      bankVersion: '1',
    };
    const parsed = parseStoredPipelineSession(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.stemRegionUsed).toBe('west_africa');
    expect(parsed!.questionBankId).toBe('cultural-adaptive-v1');
    expect(parsed!.bankVersion).toBe('1');
    expect(parsed!.profileAdaptiveSummary?.schemaVersion).toBe(1);
    expect(parsed!.profileAdaptiveSummary?.sessionConfidence).toBe(summary.sessionConfidence);
  });
});
