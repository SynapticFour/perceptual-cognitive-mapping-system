import { describe, it, expect } from 'vitest';

import { DEFAULT_COGNITIVE_VECTOR } from '@/model/cognitive-dimensions';
import { profileRMSE, simulateAssessments } from '@/research/simulation';

describe('simulation', () => {
  it('profileRMSE is zero for identical profiles', () => {
    expect(profileRMSE(DEFAULT_COGNITIVE_VECTOR, { ...DEFAULT_COGNITIVE_VECTOR })).toBe(0);
  });

  it('simulateAssessments returns bounded RMSE with noise', () => {
    const truth = [{ ...DEFAULT_COGNITIVE_VECTOR, F: 0.7, P: 0.3 }];
    const out = simulateAssessments(truth, 200, { measurementSd: 0.05 });
    expect(out.nRuns).toBe(200);
    expect(out.meanRMSE).toBeGreaterThan(0);
    expect(out.meanRMSE).toBeLessThan(0.2);
    expect(out.rmseByRun.length).toBe(200);
  });
});
