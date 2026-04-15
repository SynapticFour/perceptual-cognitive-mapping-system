import { describe, it, expect } from 'vitest';
import { parseStoredPipelineSession } from '@/lib/parse-pipeline-session';
import { PIPELINE_STORAGE_VERSION } from '@/types/pipeline-session';

describe('parseStoredPipelineSession', () => {
  it('returns null for invalid payloads', () => {
    expect(parseStoredPipelineSession(null)).toBeNull();
    expect(parseStoredPipelineSession({})).toBeNull();
    expect(parseStoredPipelineSession({ version: PIPELINE_STORAGE_VERSION })).toBeNull();
  });
});
