import type { CognitiveModel } from '@/core/cognitive-pipeline';
import { TRAIT_DOMAIN_HEX, type TraitDomain } from '@/core/traits/trait-domains';

type Rgb = { r: number; g: number; b: number };

export type CognitiveFieldMetrics = {
  localMaxima: number;
  maxPeakShare: number;
  coverage: number;
  passedMultiPeak: boolean;
  passedPeakBalance: boolean;
  passedCoverage: boolean;
  passed: boolean;
};

export type CognitiveFieldGrid = {
  rows: number;
  cols: number;
  intensity: number[][];
  color: string[][];
  maxIntensity: number;
  metrics: CognitiveFieldMetrics;
  sigma: number;
};

function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  if (h.length !== 6) return { r: 99, g: 102, b: 241 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function regionScale(share: number, meanShare: number): number {
  if (share <= 1e-9) return 1;
  const raw = meanShare / share;
  return Math.min(1.45, Math.max(0.72, Math.pow(raw, 0.4)));
}

function computeMetrics(intensity: number[][], maxIntensity: number): CognitiveFieldMetrics {
  const rows = intensity.length;
  const cols = intensity[0]?.length ?? 0;
  if (rows === 0 || cols === 0 || maxIntensity <= 1e-9) {
    return {
      localMaxima: 0,
      maxPeakShare: 1,
      coverage: 0,
      passedMultiPeak: false,
      passedPeakBalance: false,
      passedCoverage: false,
      passed: false,
    };
  }
  const peakThreshold = 0.3 * maxIntensity;
  const peaks: number[] = [];
  let covered = 0;

  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const v = intensity[y]![x]!;
      if (v >= 0.003 * maxIntensity) covered++;
      if (v < peakThreshold) continue;
      let isPeak = true;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (intensity[y + dy]![x + dx]! > v) {
            isPeak = false;
            break;
          }
        }
        if (!isPeak) break;
      }
      if (isPeak) peaks.push(v);
    }
  }
  peaks.sort((a, b) => b - a);
  const peakSum = peaks.reduce((s, v) => s + v, 0);
  const maxPeakShare = peakSum > 1e-9 ? peaks[0]! / peakSum : 1;
  const coverage = covered / ((rows - 2) * (cols - 2));
  const passedMultiPeak = peaks.length >= 2;
  const passedPeakBalance = maxPeakShare <= 0.65 + 1e-9;
  const passedCoverage = coverage >= 0.5 - 1e-9;
  return {
    localMaxima: peaks.length,
    maxPeakShare,
    coverage,
    passedMultiPeak,
    passedPeakBalance,
    passedCoverage,
    passed: passedMultiPeak && passedPeakBalance && passedCoverage,
  };
}

function buildAtSigma(model: CognitiveModel, rows: number, cols: number, sigma: number): CognitiveFieldGrid {
  const intensity = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const color = Array.from({ length: rows }, () => new Array(cols).fill('rgba(99,102,241,0)'));
  const k = model.activations.length;
  const domainList: TraitDomain[] = [
    'perception',
    'cognition',
    'attention',
    'regulation',
    'social',
    'motivation',
  ];
  const rgbByDomain = new Map<TraitDomain, Rgb>(
    domainList.map((d) => [d, hexToRgb(TRAIT_DOMAIN_HEX[d])])
  );

  const regionByAct = new Array(k).fill(-1);
  const regionStrength = model.cognitiveRegions.map((r) => r.strength);
  const totalRegionStrength = regionStrength.reduce((s, v) => s + v, 0) || 1;
  const meanShare =
    model.cognitiveRegions.length > 0 ? 1 / model.cognitiveRegions.length : 1;
  const regionScales = regionStrength.map((s) =>
    regionScale(s / totalRegionStrength, meanShare)
  );
  model.cognitiveRegions.forEach((r, ri) => {
    r.pointIndices.forEach((ai) => {
      if (ai >= 0 && ai < k) regionByAct[ai] = ri;
    });
  });

  const inv2Sigma2 = 1 / Math.max(1e-9, 2 * sigma * sigma);
  const wideSigma = Math.max(0.14, sigma * 2.6);
  const inv2WideSigma2 = 1 / Math.max(1e-9, 2 * wideSigma * wideSigma);
  let maxIntensity = 0;
  for (let gy = 0; gy < rows; gy++) {
    const ny = 1 - (gy + 0.5) / rows;
    for (let gx = 0; gx < cols; gx++) {
      const nx = (gx + 0.5) / cols;
      let sum = 0;
      const byDomain = new Map<TraitDomain, number>();
      for (let i = 0; i < k; i++) {
        const p = model.projectedPoints[i]!;
        const dx = nx - p.x;
        const dy = ny - p.y;
        const g = Math.exp(-(dx * dx + dy * dy) * inv2Sigma2);
        const ri = regionByAct[i];
        const rs = ri >= 0 ? regionScales[ri]! : 1;
        const w = (model.pointWeights[i] ?? model.activations[i]!.weight) * rs;
        const c = g * w;
        sum += c;
        const d = model.activations[i]!.domain;
        byDomain.set(d, (byDomain.get(d) ?? 0) + c);
      }
      for (let ri = 0; ri < model.cognitiveRegions.length; ri++) {
        const region = model.cognitiveRegions[ri]!;
        const dx = nx - region.centroid.x;
        const dy = ny - region.centroid.y;
        const g = Math.exp(-(dx * dx + dy * dy) * inv2WideSigma2);
        const c = g * (0.08 + 0.12 * region.displayStrength);
        sum += c;
        const d = region.primaryDomain;
        byDomain.set(d, (byDomain.get(d) ?? 0) + c);
      }
      intensity[gy]![gx] = sum;
      maxIntensity = Math.max(maxIntensity, sum);
      if (sum <= 1e-9) continue;
      let r = 0;
      let g = 0;
      let b = 0;
      for (const d of domainList) {
        const frac = (byDomain.get(d) ?? 0) / sum;
        const rgb = rgbByDomain.get(d)!;
        r += rgb.r * frac;
        g += rgb.g * frac;
        b += rgb.b * frac;
      }
      color[gy]![gx] = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
    }
  }

  const metrics = computeMetrics(intensity, maxIntensity);
  return { rows, cols, intensity, color, maxIntensity, metrics, sigma };
}

export function buildCognitiveFieldGrid(
  model: CognitiveModel,
  rows = 86,
  cols = 86
): CognitiveFieldGrid {
  const sigmas = [0.082, 0.074, 0.066, 0.058, 0.05];
  let best: CognitiveFieldGrid | null = null;
  for (const sigma of sigmas) {
    const g = buildAtSigma(model, rows, cols, sigma);
    if (!best) best = g;
    if (g.metrics.passed) return g;
    if (
      g.metrics.localMaxima > best.metrics.localMaxima ||
      (g.metrics.localMaxima === best.metrics.localMaxima &&
        g.metrics.maxPeakShare < best.metrics.maxPeakShare)
    ) {
      best = g;
    }
  }
  return best!;
}

