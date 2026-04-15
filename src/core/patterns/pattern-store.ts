import { minePatterns } from '@/core/patterns/pattern-mining';
import type { CognitivePattern } from '@/core/patterns/types';

const MAX_SIGNATURES = 8000;

/** In-memory history for this runtime (browser tab or Node process). */
let signatureHistory: string[][] = [];
let minedCache: CognitivePattern[] = [];
let cacheDirty = true;
let storeVersion = 0;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  storeVersion++;
  for (const cb of listeners) cb();
}

function recomputeIfNeeded(): void {
  if (!cacheDirty) return;
  minedCache = minePatterns(signatureHistory);
  cacheDirty = false;
}

/** Subscribe to store updates (new signatures recorded). */
export function subscribePatternStore(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Monotonic version for `useSyncExternalStore` / tests. */
export function getPatternStoreVersion(): number {
  return storeVersion;
}

/**
 * Append a user signature and invalidate the mined pattern cache.
 * Returns whether the history changed.
 */
export function recordUserSignature(signature: readonly string[]): boolean {
  if (signature.length < 2) return false;
  signatureHistory.push([...signature]);
  if (signatureHistory.length > MAX_SIGNATURES) {
    signatureHistory = signatureHistory.slice(-MAX_SIGNATURES);
  }
  cacheDirty = true;
  notifyListeners();
  return true;
}

/** Current mined patterns from all recorded signatures. */
export function getDiscoveredPatterns(): CognitivePattern[] {
  recomputeIfNeeded();
  return [...minedCache];
}

/** For tests / tooling only — clears history and cache. */
export function resetPatternStoreForTests(): void {
  signatureHistory = [];
  minedCache = [];
  cacheDirty = true;
  storeVersion = 0;
  listeners.clear();
}
