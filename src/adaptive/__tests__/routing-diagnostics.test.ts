import { describe, expect, it } from 'vitest';
import { buildPerDimensionRoutingDiagnostics } from '@/adaptive/routing-diagnostics';
import { getAssessmentQuestions } from '@/data/questions';

describe('buildPerDimensionRoutingDiagnostics', () => {
  it('returns all routing keys with finite values for real history', () => {
    const qs = getAssessmentQuestions('core', 'universal').slice(0, 2);
    expect(qs.length).toBeGreaterThanOrEqual(2);
    const byId = new Map(getAssessmentQuestions('all', 'universal').map((q) => [q.id, q]));
    const history = qs.map((q, i) => ({
      questionId: q.id,
      response: 3 as const,
      timestamp: new Date(`2026-03-0${i + 1}T12:00:00Z`),
      responseTimeMs: 100,
    }));
    const diag = buildPerDimensionRoutingDiagnostics(history, byId);
    expect(diag.F).toBeDefined();
    expect(diag.F.confidence).toBeGreaterThanOrEqual(0);
    expect(diag.F.mean01).toBeGreaterThanOrEqual(0);
    expect(diag.F.mean01).toBeLessThanOrEqual(1);
  });
});
