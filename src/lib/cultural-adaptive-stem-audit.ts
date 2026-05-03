/**
 * Lightweight **structural** stem differentiation audit (token Jaccard on normalised text).
 * Does not claim semantic equivalence across languages; flags **near-identical** English surface forms only.
 */
import type { CulturalAdaptiveBankJsonRow } from '@/lib/cultural-adaptive-bank';

function normalise(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter += 1;
  }
  const union = A.size + B.size - inter;
  return union <= 0 ? 0 : inter / union;
}

export type StemSimilarityFlag = {
  id: string;
  dimension: string;
  /** Highest pairwise Jaccard among global / ghana / west_africa (0–1). */
  maxPairSimilarity: number;
  /** Which pair achieved max (for reporting). */
  pair: 'global_ghana' | 'global_west_africa' | 'ghana_west_africa';
};

const DEFAULT_THRESHOLD = 0.88;

/**
 * Lists items whose regional stems are **very** similar (likely weak differentiation).
 * Does **not** modify bank content.
 */
export function auditCulturalAdaptiveStemSimilarity(
  rows: CulturalAdaptiveBankJsonRow[],
  threshold: number = DEFAULT_THRESHOLD
): StemSimilarityFlag[] {
  const out: StemSimilarityFlag[] = [];
  for (const row of rows) {
    const v = row.variants;
    const g = normalise(String(v.global ?? ''));
    const gh = normalise(String(v.ghana ?? ''));
    const wa = normalise(String(v.west_africa ?? ''));
    const jGg = jaccard(g, gh);
    const jGw = jaccard(g, wa);
    const jHw = jaccard(gh, wa);
    let max = jGg;
    let pair: StemSimilarityFlag['pair'] = 'global_ghana';
    if (jGw > max) {
      max = jGw;
      pair = 'global_west_africa';
    }
    if (jHw > max) {
      max = jHw;
      pair = 'ghana_west_africa';
    }
    if (max >= threshold) {
      out.push({ id: row.id, dimension: row.dimension, maxPairSimilarity: Math.round(max * 1000) / 1000, pair });
    }
  }
  return out;
}
