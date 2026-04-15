/**
 * Classical psychometrics helpers (Cronbach, ICC, item–total, split-half).
 * Edge cases return NaN where the statistic is undefined; callers should filter.
 */

function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function varianceSample(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
}

function pearsonCore(a: number[], b: number[]): number {
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

/**
 * Cronbach's α for a scale.
 * @param items Rows = persons, columns = items (each score on the same metric).
 */
export function cronbachAlpha(items: number[][]): number {
  if (items.length < 2) return NaN;
  const k = items[0]?.length ?? 0;
  if (k < 2) return NaN;
  for (const row of items) {
    if (row.length !== k) return NaN;
  }

  const variances = Array.from({ length: k }, (_, j) => {
    const col = items.map((row) => row[j]!);
    return varianceSample(col);
  });
  if (variances.some((v) => !Number.isFinite(v))) return NaN;

  const totalScores = items.map((row) => row.reduce((s, v) => s + v, 0));
  const varTotal = varianceSample(totalScores);
  if (!Number.isFinite(varTotal) || varTotal <= 0) return NaN;

  const sumVarItems = variances.reduce((a, b) => a + b, 0);
  return (k / (k - 1)) * (1 - sumVarItems / varTotal);
}

/**
 * One-way random ICC for two measurements per subject (test–retest).
 * Shrout–Fleiss ICC(1,2) style: MSB vs MSW with k = 2 sessions per person.
 */
export function icc(session1: number[], session2: number[]): number {
  const n = session1.length;
  if (n < 2 || session2.length !== n) return NaN;

  const k = 2;
  const g = (session1.reduce((a, b) => a + b, 0) + session2.reduce((a, b) => a + b, 0)) / (n * k);

  let msb = 0;
  let msw = 0;
  for (let i = 0; i < n; i++) {
    const a = session1[i]!;
    const b = session2[i]!;
    const mi = (a + b) / 2;
    msb += (mi - g) ** 2;
    msw += (a - mi) ** 2 + (b - mi) ** 2;
  }
  msb = (k * msb) / (n - 1);
  msw = msw / (n * (k - 1));
  if (!Number.isFinite(msb) || !Number.isFinite(msw)) return NaN;
  if (msb + (k - 1) * msw === 0) return NaN;
  return (msb - msw) / (msb + (k - 1) * msw);
}

/** Corrected item–total correlation (item vs total minus that item). */
export function itemTotalCorrelation(itemScores: number[], totalScores: number[]): number {
  const n = itemScores.length;
  if (n < 3 || totalScores.length !== n) return NaN;
  const restTotal = itemScores.map((x, i) => totalScores[i]! - x);
  return pearsonCore(itemScores, restTotal);
}

/**
 * Split-half reliability with Spearman–Brown prophecy to full length.
 * @param scores Rows = persons, columns = items (even k preferred).
 */
export function splitHalfReliability(scores: number[][]): number {
  if (scores.length < 2) return NaN;
  const k = scores[0]?.length ?? 0;
  if (k < 2) return NaN;
  for (const row of scores) {
    if (row.length !== k) return NaN;
  }

  const mid = Math.floor(k / 2);
  const first = scores.map((row) => row.slice(0, mid).reduce((s, v) => s + v, 0));
  const second = scores.map((row) => row.slice(mid).reduce((s, v) => s + v, 0));
  const r = pearsonCore(first, second);
  if (!Number.isFinite(r)) return NaN;
  return (2 * r) / (1 + r);
}
