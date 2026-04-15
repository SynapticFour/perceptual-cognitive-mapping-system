import type { CognitivePattern } from '@/core/patterns/types';

const MIN_SUPPORT_PAIR = 2;
const MIN_SUPPORT_TRIPLET = 2;
const MAX_PATTERNS = 48;

function sortedUnique(ids: string[]): string[] {
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

function patternId(kind: 'pair' | 'trip', traits: string[]): string {
  const t = traits.join('+');
  return `${kind}:${t}`;
}

/**
 * Frequency mining over user signatures: counts co-occurring pairs and triplets.
 * Deterministic; no ML.
 */
export function minePatterns(signatures: readonly (readonly string[])[]): CognitivePattern[] {
  const total = Math.max(1, signatures.length);
  const pairCounts = new Map<string, number>();
  const tripCounts = new Map<string, number>();

  for (const raw of signatures) {
    const u = sortedUnique([...raw]);
    const n = u.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const key = `${u[i]}|${u[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        for (let k = j + 1; k < n; k++) {
          const tkey = `${u[i]}|${u[j]}|${u[k]}`;
          tripCounts.set(tkey, (tripCounts.get(tkey) ?? 0) + 1);
        }
      }
    }
  }

  const out: CognitivePattern[] = [];

  for (const [key, support] of pairCounts) {
    if (support < MIN_SUPPORT_PAIR) continue;
    const traits = key.split('|');
    out.push({
      id: patternId('pair', traits),
      traits,
      support,
      strength: support / total,
    });
  }

  for (const [key, support] of tripCounts) {
    if (support < MIN_SUPPORT_TRIPLET) continue;
    const traits = key.split('|');
    out.push({
      id: patternId('trip', traits),
      traits,
      support,
      strength: support / total,
    });
  }

  out.sort((a, b) => b.support - a.support || b.strength - a.strength);
  return out.slice(0, MAX_PATTERNS);
}
