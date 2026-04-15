import type { CognitiveActivation } from '@/core/traits/types';

/** Prefer broad signatures (full field), not “top traits only”. */
export const SIGNATURE_TOP_N = 32;
/** Soft floor for pattern mining — well below old 0.3 cut so weak-but-present traits count. */
export const SIGNATURE_WEIGHT_MIN = 0.06;

export type ExtractSignatureOptions = {
  topN?: number;
  weightMin?: number;
};

/**
 * Reduces a user’s activations to a stable trait-id list for pattern mining:
 * weight ≥ soft threshold, then top-N by weight, sorted lexicographically.
 */
export function extractUserSignature(
  activations: readonly CognitiveActivation[],
  options?: ExtractSignatureOptions
): string[] {
  const topN = options?.topN ?? SIGNATURE_TOP_N;
  const weightMin = options?.weightMin ?? SIGNATURE_WEIGHT_MIN;
  const filtered = activations.filter((a) => a.weight >= weightMin);
  filtered.sort((a, b) => b.weight - a.weight);
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const a of filtered) {
    if (ordered.length >= topN) break;
    if (seen.has(a.traitId)) continue;
    seen.add(a.traitId);
    ordered.push(a.traitId);
  }
  return [...ordered].sort((x, y) => x.localeCompare(y));
}
