import { describe, expect, it } from 'vitest';
import {
  buildOfflinePendingFullSessionJson,
  offlineResponseRowsToQuestionResponses,
} from '@/lib/offline-storage';
import { PIPELINE_STORAGE_VERSION } from '@/types/pipeline-session';
import type { StoredPipelineSession } from '@/types/pipeline-session';

describe('offline-storage export helpers', () => {
  it('offlineResponseRowsToQuestionResponses restores Date timestamps', () => {
    const rows = [
      {
        questionId: 'q1',
        response: 3,
        responseTimeMs: 500,
        timestamp: '2026-05-01T12:00:00.000Z',
        questionCategory: 'focus',
        dimensionWeights: { F: 1 },
      },
    ];
    const out = offlineResponseRowsToQuestionResponses(rows);
    expect(out).toHaveLength(1);
    expect(out[0]!.questionId).toBe('q1');
    expect(out[0]!.timestamp.toISOString()).toBe('2026-05-01T12:00:00.000Z');
  });

  it('buildOfflinePendingFullSessionJson returns null without profile', () => {
    expect(
      buildOfflinePendingFullSessionJson({
        sessionId: 's1',
        responses: [],
        profile: null,
        timestamp: '2026-01-01',
        synced: false,
      })
    ).toBeNull();
  });

  it('buildOfflinePendingFullSessionJson embeds pipeline', () => {
    const profile: StoredPipelineSession = {
      version: PIPELINE_STORAGE_VERSION,
      adaptiveMode: 'routing_coverage',
      researchMode: false,
      questionBankId: 'test',
      bankVersion: '1',
      stemRegionUsed: 'global',
      completedAt: '2026-01-01T00:00:00Z',
      responseCount: 1,
      publicProfile: {
        summary: 'x',
        patterns: [],
        notes: [],
        confidence: 0.5,
      },
      embedding: { dimension: 2, version: 't', confidence: 0.5, vector: [0, 0] },
      featureHighlights: { overallConfidence: 0.5, answerConsistency: 0.5, entropy: 0.5 },
      scoringResult: {
        confidenceComponents: {
          F: { effectiveEvidence: 1, reliability: 1, consistency: 1, finalConfidence: 0.5, meetsMinimumSample: true },
          P: { effectiveEvidence: 1, reliability: 1, consistency: 1, finalConfidence: 0.5, meetsMinimumSample: true },
          S: { effectiveEvidence: 1, reliability: 1, consistency: 1, finalConfidence: 0.5, meetsMinimumSample: true },
          E: { effectiveEvidence: 1, reliability: 1, consistency: 1, finalConfidence: 0.5, meetsMinimumSample: true },
          R: { effectiveEvidence: 1, reliability: 1, consistency: 1, finalConfidence: 0.5, meetsMinimumSample: true },
          C: { effectiveEvidence: 1, reliability: 1, consistency: 1, finalConfidence: 0.5, meetsMinimumSample: true },
          T: { effectiveEvidence: 1, reliability: 1, consistency: 1, finalConfidence: 0.5, meetsMinimumSample: true },
          I: { effectiveEvidence: 1, reliability: 1, consistency: 1, finalConfidence: 0.5, meetsMinimumSample: true },
          A: { effectiveEvidence: 1, reliability: 1, consistency: 1, finalConfidence: 0.5, meetsMinimumSample: true },
          V: { effectiveEvidence: 1, reliability: 1, consistency: 1, finalConfidence: 0.5, meetsMinimumSample: true },
        },
      },
    };
    const json = buildOfflinePendingFullSessionJson({
      sessionId: 's2',
      responses: [
        {
          questionId: 'q1',
          response: 2,
          responseTimeMs: 100,
          timestamp: '2026-05-02T10:00:00.000Z',
          questionCategory: 'focus',
          dimensionWeights: { F: 1 },
        },
      ],
      profile,
      timestamp: '2026-05-02T10:00:00.000Z',
      synced: false,
    });
    expect(json).toBeTruthy();
    const parsed = JSON.parse(json!) as { schemaVersion: number; pipelineSession: { responseCount: number } };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.pipelineSession.responseCount).toBe(1);
  });
});
