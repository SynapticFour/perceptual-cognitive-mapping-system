import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { buildFullSessionExportV1, buildResearchSessionZip } from '@/lib/research-session-bundle';
import { sampleQuestionHistory, sampleStoredSession } from '../../../e2e/fixtures/results-session';

describe('research-session-bundle', () => {
  it('buildFullSessionExportV1 nests pipeline and serializes timestamps', () => {
    const out = buildFullSessionExportV1(sampleStoredSession, sampleQuestionHistory);
    expect(out.schemaVersion).toBe(1);
    expect(out.pipelineSession.version).toBe(sampleStoredSession.version);
    expect(out.questionHistory).toHaveLength(sampleQuestionHistory.length);
    expect(out.questionHistory[0]?.timestamp).toMatch(/^\d{4}-/);
  });

  it('ZIP includes full-session.json and manifest integrity.fullSessionSha256', async () => {
    const zip = await buildResearchSessionZip({
      stored: sampleStoredSession,
      history: sampleQuestionHistory,
      locale: 'en',
      consentTimestamp: null,
      bankItemCount: 10,
    });
    const files = unzipSync(zip);
    const names = Object.keys(files);
    expect(names).toContain('full-session.json');
    const manifest = JSON.parse(new TextDecoder().decode(files['manifest.json']!));
    expect(manifest.integrity.fullSessionSha256).toMatch(/^[a-f0-9]{64}$/);
    const full = JSON.parse(new TextDecoder().decode(files['full-session.json']!));
    expect(full.schemaVersion).toBe(1);
    expect(full.pipelineSession.responseCount).toBe(sampleStoredSession.responseCount);
  });
});
