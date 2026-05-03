import { describe, expect, it } from 'vitest';
import { computeProfileAdaptiveSnapshot, toProfileAdaptiveSessionSummary } from '@/adaptive';
import { buildTraitVector } from '@/lib/trait-vector';
import { sampleStoredSession } from '../../../e2e/fixtures/results-session';

describe('buildTraitVector', () => {
  it('merges scoring reliability with profile contradiction when summary exists', () => {
    const snap = computeProfileAdaptiveSnapshot([], new Map());
    const session = {
      ...sampleStoredSession,
      profileAdaptiveSummary: toProfileAdaptiveSessionSummary(snap),
    };
    const tv = buildTraitVector(session);
    expect(tv.schemaVersion).toBe(1);
    expect(tv.dimensions.F.confidence).toBe(session.scoringResult.confidenceComponents.F.finalConfidence);
    expect(tv.dimensions.F.score).toBe(session.scoringResult.confidenceComponents.F.reliability);
    expect(typeof tv.dimensions.F.contradiction).toBe('number');
  });
});
