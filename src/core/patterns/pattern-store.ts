import { minePatterns } from '@/core/patterns/pattern-mining';
import type { CognitivePattern } from '@/core/patterns/types';

const MAX_SIGNATURES = 8000;

/** In-memory history for this runtime (browser tab or Node process). */
let signatureHistory: string[][] = [];
/** Optional cohort / study context labels (parallel to `signatureHistory`). */
let signatureContexts: (string | undefined)[] = [];
let lastMutationAt = 0;
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
  return recordUserSignatureWithContext(signature, undefined);
}

/**
 * Same as {@link recordUserSignature} but keeps an optional anonymized context tag
 * (e.g. cohort type) for aggregate analytics — never store personal identifiers here.
 */
export function recordUserSignatureWithContext(
  signature: readonly string[],
  context?: string
): boolean {
  if (signature.length < 2) return false;
  signatureHistory.push([...signature]);
  signatureContexts.push(context);
  if (signatureHistory.length > MAX_SIGNATURES) {
    signatureHistory = signatureHistory.slice(-MAX_SIGNATURES);
    signatureContexts = signatureContexts.slice(-MAX_SIGNATURES);
  }
  lastMutationAt = Date.now();
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
  signatureContexts = [];
  lastMutationAt = 0;
  minedCache = [];
  cacheDirty = true;
  storeVersion = 0;
  listeners.clear();
}

export type PatternLibrarySnapshot = {
  patterns: CognitivePattern[];
  lastUpdated: number;
  totalSignatures: number;
  /** Parallel to internal history (same length as totalSignatures when exposed). */
  contexts: (string | undefined)[];
};

/** Global, anonymized pattern library state for cohort / research tooling. */
export function getPatternLibrarySnapshot(): PatternLibrarySnapshot {
  recomputeIfNeeded();
  return {
    patterns: [...minedCache],
    lastUpdated: lastMutationAt,
    totalSignatures: signatureHistory.length,
    contexts: [...signatureContexts],
  };
}

/** Return top patterns by support (descriptive co-activation, not diagnostic). */
export function getTopPatterns(limit = 12): CognitivePattern[] {
  const snap = getPatternLibrarySnapshot();
  return snap.patterns.slice(0, limit);
}
