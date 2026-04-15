import { COGNITIVE_DIMENSION_KEYS, type CognitiveVector } from '@/model/cognitive-dimensions';

import type { CorrelationMatrix, ValidityResult } from './types';

function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Error function approximation (Abramowitz & Stegun 7.1.26), sufficient for p-value tails. */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = a.length;
  if (n < 2 || b.length !== n) return NaN;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i]! - ma;
    const xb = b[i]! - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  const den = Math.sqrt(da * db);
  if (den === 0) return NaN;
  return num / den;
}

function twoTailPFromPearsonR(r: number, n: number): number {
  if (n < 4 || !Number.isFinite(r)) return NaN;
  const df = n - 2;
  const denom = Math.sqrt(Math.max(1e-15, 1 - r * r));
  const t = (Math.abs(r) * Math.sqrt(df)) / denom;
  const z = t;
  const pOne = 1 - normalCdf(z);
  /** Floor avoids exact 0 when |r|≈1 and the normal tail underflows in double precision. */
  return Math.min(1, Math.max(1e-15, 2 * pOne));
}

function interpretConvergent(r: number, p: number): string {
  if (!Number.isFinite(r)) return 'Correlation undefined (insufficient variance or sample).';
  const mag = Math.abs(r);
  let strength = 'negligible';
  if (mag >= 0.5) strength = 'strong';
  else if (mag >= 0.3) strength = 'moderate';
  else if (mag >= 0.1) strength = 'weak';
  const sig = p < 0.05 ? 'statistically distinguishable from zero at α≈0.05 (normal approximation to the t statistic)' : 'not significant at α≈0.05 under the same approximation';
  return `${strength} positive/negative association (|r|=${mag.toFixed(2)}), ${sig}. This is evidence quality, not clinical truth.`;
}

/**
 * Convergent validity: Pearson r between a PCMS dimension series and an external criterion,
 * with a two-tailed p-value approximated via normal tail on the t statistic for r.
 */
export function convergentValidity(pcmsDimension: number[], externalMeasure: number[]): ValidityResult {
  const n = pcmsDimension.length;
  const r = pearsonCorrelation(pcmsDimension, externalMeasure);
  const pApprox = twoTailPFromPearsonR(r, n);
  return {
    r,
    pApprox,
    n,
    interpretation: interpretConvergent(r, pApprox),
  };
}

/**
 * Inter-dimension correlation matrix across persons (columns = dimensions from {@link CognitiveVector}).
 */
export function dimensionCorrelationMatrix(profiles: CognitiveVector[]): CorrelationMatrix {
  const dimensions = [...COGNITIVE_DIMENSION_KEYS];
  const k = dimensions.length;
  const matrix: number[][] = Array.from({ length: k }, () => Array(k).fill(NaN));

  if (profiles.length < 2) {
    return { dimensions, matrix };
  }

  const cols = dimensions.map((d) => profiles.map((p) => p[d]));

  for (let i = 0; i < k; i++) {
    matrix[i]![i] = 1;
    for (let j = i + 1; j < k; j++) {
      const r = pearsonCorrelation(cols[i]!, cols[j]!);
      matrix[i]![j] = r;
      matrix[j]![i] = r;
    }
  }

  return { dimensions, matrix };
}
