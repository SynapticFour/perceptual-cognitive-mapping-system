/**
 * Synthetic reference population in latent space — clusters around base profiles
 * (e.g. lifted archetypes) for landscape-style visualization.
 */

/** Mulberry32 PRNG for reproducible populations when a seed is provided. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param baseVectors Non-empty reference rows (same length each).
 * @param count Number of synthetic points to generate.
 * @param noiseScale Gaussian-ish spread factor (typical 0.05–0.15).
 * @param rnd Random in [0,1); defaults to `Math.random`.
 */
export function generateSyntheticPopulation(
  baseVectors: number[][],
  count: number,
  noiseScale = 0.1,
  rnd: () => number = Math.random
): number[][] {
  if (baseVectors.length === 0 || count <= 0) return [];
  const dim = baseVectors[0].length;
  if (!baseVectors.every((v) => v.length === dim)) {
    throw new Error('generateSyntheticPopulation: all baseVectors must share the same length');
  }

  const out: number[][] = [];
  for (let i = 0; i < count; i++) {
    const pick = baseVectors[(rnd() * baseVectors.length) | 0]!;
    const v = pick.slice();
    for (let j = 0; j < dim; j++) {
      const g = (rnd() + rnd() + rnd() + rnd() - 2) * 0.5;
      v[j] = Math.max(0, Math.min(1, v[j] + g * noiseScale));
    }
    out.push(v);
  }
  return out;
}
