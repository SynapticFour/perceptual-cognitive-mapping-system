import type { StoredPipelineSession } from '../../src/types/pipeline-session';
import { PIPELINE_STORAGE_VERSION } from '../../src/types/pipeline-session';
import type { QuestionResponse } from '../../src/data/questions';

const dim = (final: number, meets: boolean) => ({
  effectiveEvidence: 1,
  reliability: 0.7,
  consistency: 0.9,
  finalConfidence: final,
  meetsMinimumSample: meets,
});

export const sampleStoredSession: StoredPipelineSession = {
  version: PIPELINE_STORAGE_VERSION,
  adaptiveMode: 'routing_coverage',
  researchMode: false,
  questionBankId: 'routing_classic',
  bankVersion: '1',
  stemRegionUsed: 'global',
  completedAt: new Date().toISOString(),
  responseCount: 3,
  publicProfile: {
    summary: 'This is a fixture summary for automated visual tests of the results layout.',
    patterns: ['Fixture pattern A', 'Fixture pattern B'],
    notes: ['Fixture note: not a clinical assessment.'],
    confidence: 0.72,
  },
  embedding: {
    dimension: 32,
    version: 'latent-v1.0',
    confidence: 0.68,
    vector: Array.from({ length: 32 }, (_, i) => (i % 5) * 0.01),
  },
  featureHighlights: {
    overallConfidence: 0.6,
    answerConsistency: 0.55,
    entropy: 0.4,
  },
  scoringResult: {
    confidenceComponents: {
      F: dim(0.82, true),
      P: dim(0.78, true),
      S: dim(0.7, true),
      E: dim(0.66, false),
      R: dim(0.8, true),
      C: dim(0.74, false),
      T: dim(0.65, false),
      I: dim(0.71, true),
      A: dim(0.68, false),
      V: dim(0.77, true),
    },
  },
};

export const sampleQuestionHistory: QuestionResponse[] = [
  {
    questionId: 'F-core-001',
    response: 4,
    timestamp: new Date('2026-01-02T10:00:00Z'),
    responseTimeMs: 1200,
  },
  {
    questionId: 'P-core-001',
    response: 3,
    timestamp: new Date('2026-01-02T10:01:00Z'),
    responseTimeMs: 1500,
  },
  {
    questionId: 'S-core-001',
    response: 5,
    timestamp: new Date('2026-01-02T10:02:00Z'),
    responseTimeMs: 900,
  },
];
