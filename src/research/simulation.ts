import { COGNITIVE_DIMENSION_KEYS, type CognitiveVector } from '@/model/cognitive-dimensions';

import type { SimulationResult } from './types';

function zeroVector(): CognitiveVector {
  return Object.fromEntries(COGNITIVE_DIMENSION_KEYS.map((d) => [d, 0])) as CognitiveVector;
}

/** Standard normal draw (Box–Muller). */
function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Root mean squared error across the ten routing dimensions (unit interval).
 */
export function profileRMSE(trueProfile: CognitiveVector, estimatedProfile: CognitiveVector): number {
  let s = 0;
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    const e = trueProfile[d] - estimatedProfile[d];
    s += e * e;
  }
  return Math.sqrt(s / COGNITIVE_DIMENSION_KEYS.length);
}

/**
 * Monte-Carlo check: each run picks a cyclic true profile, adds i.i.d. Gaussian noise per dimension
 * (clipped to [0,1]) as a stand-in for posterior error. Plug in the adaptive likelihood step here
 * for full engine-in-the-loop validation when the live bank + policy are available.
 */
export function simulateAssessments(
  trueProfiles: CognitiveVector[],
  n: number,
  options?: { measurementSd?: number }
): SimulationResult {
  if (trueProfiles.length === 0 || n < 1) {
    return { nRuns: 0, meanRMSE: NaN, rmseByRun: [], meanBias: zeroVector() };
  }

  const sd = options?.measurementSd ?? 0.08;
  const rmseByRun: number[] = [];
  const biasSum = zeroVector();

  for (let i = 0; i < n; i++) {
    const truth = trueProfiles[i % trueProfiles.length]!;
    const est: CognitiveVector = { ...truth };
    for (const d of COGNITIVE_DIMENSION_KEYS) {
      const noisy = truth[d] + gaussian() * sd;
      est[d] = Math.max(0, Math.min(1, noisy));
      biasSum[d] += est[d] - truth[d];
    }
    rmseByRun.push(profileRMSE(truth, est));
  }

  const meanRMSE = rmseByRun.reduce((a, b) => a + b, 0) / rmseByRun.length;
  const meanBias = zeroVector();
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    meanBias[d] = biasSum[d] / n;
  }

  return { nRuns: n, meanRMSE, rmseByRun, meanBias };
}
