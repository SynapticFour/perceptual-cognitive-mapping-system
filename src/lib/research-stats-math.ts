/** Small in-repo stats helpers for the research dashboard (no extra dependencies). */

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
}

export function stddev(values: number[]): number {
  return Math.sqrt(variance(values));
}

export function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ax = a.slice(0, n);
  const bx = b.slice(0, n);
  const ma = mean(ax);
  const mb = mean(bx);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const xa = ax[i]! - ma;
    const xb = bx[i]! - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

export function welchTTest(a: number[], b: number[]): { t: number; df: number } {
  const na = a.length;
  const nb = b.length;
  if (na < 2 || nb < 2) return { t: 0, df: na + nb - 2 };
  const ma = mean(a);
  const mb = mean(b);
  const va = variance(a);
  const vb = variance(b);
  const sea = va / na;
  const seb = vb / nb;
  const se = Math.sqrt(sea + seb);
  if (se === 0) return { t: 0, df: na + nb - 2 };
  const t = (ma - mb) / se;
  const num = sea + seb;
  const den = sea ** 2 / (na - 1) + seb ** 2 / (nb - 1);
  const df = den === 0 ? na + nb - 2 : num ** 2 / den;
  return { t, df: Math.max(1, df) };
}

export function cohenD(a: number[], b: number[]): number {
  const na = a.length;
  const nb = b.length;
  if (na < 2 || nb < 2) return 0;
  const ma = mean(a);
  const mb = mean(b);
  const va = variance(a);
  const vb = variance(b);
  const pooled = Math.sqrt(((na - 1) * va + (nb - 1) * vb) / (na + nb - 2));
  if (pooled === 0) return 0;
  return (ma - mb) / pooled;
}

export function histogramBins(values: number[], binCount: number, min?: number, max?: number): { bin: number; count: number }[] {
  if (values.length === 0) return [];
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const width = (hi - lo) / binCount || 1;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    bin: lo + (i + 0.5) * width,
    count: 0,
  }));
  for (const v of values) {
    let idx = Math.floor((v - lo) / width);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    bins[idx]!.count += 1;
  }
  return bins;
}

/** Simple Gaussian KDE on a fixed grid (for Recharts line overlay). */
export function kdePoints(
  values: number[],
  gridMin: number,
  gridMax: number,
  points: number,
  bandwidth?: number
): { x: number; y: number }[] {
  const n = values.length;
  if (n === 0) return [];
  const sd = stddev(values) || 1;
  const h = bandwidth ?? (1.06 * sd * Math.pow(n, -1 / 5));
  const step = (gridMax - gridMin) / (points - 1);
  const out: { x: number; y: number }[] = [];
  const inv = 1 / (n * h * Math.sqrt(2 * Math.PI));
  for (let i = 0; i < points; i++) {
    const x = gridMin + i * step;
    let sum = 0;
    for (const xi of values) {
      const z = (x - xi) / h;
      sum += Math.exp(-0.5 * z * z);
    }
    out.push({ x, y: sum * inv });
  }
  return out;
}
