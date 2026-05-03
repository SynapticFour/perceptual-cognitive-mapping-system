import { COGNITIVE_DIMENSION_KEYS, type CognitiveDimension } from '@/model/cognitive-dimensions';
import type { ConfidenceComponents } from '@/scoring';
import type { DimensionDisplayModel } from '@/lib/dimension-display';

const VERSION = 1 as const;

/**
 * **URL / SMS share payloads are not a scientific record.**
 * They deliberately omit: full `ConfidenceComponents` (evidence, reliability, consistency, sample gates),
 * within-session contradiction / profile diagnostics, raw answers, question bank version, stem region,
 * and adaptive policy. **Do not use `LandscapeSharePayload` for research analysis** — use
 * `StoredPipelineSession`, `full-session.json`, or authorised database exports.
 */

/** Browsers and intermediaries often cap URLs; keep share payloads well under practical limits. */
export const MAX_SHARE_URL_LENGTH = 2000;

/**
 * Prefer `?p=` on the current URL; if too long, fall back to `#p=` (hash is not sent to the server).
 */
export function buildShareableResultsUrl(
  currentHref: string,
  encodedPayload: string
): { ok: true; url: string } | { ok: false; reason: 'too_long' } {
  const withQuery = new URL(currentHref);
  withQuery.hash = '';
  withQuery.searchParams.set('p', encodedPayload);
  const queryUrl = withQuery.toString();
  if (queryUrl.length <= MAX_SHARE_URL_LENGTH) {
    return { ok: true, url: queryUrl };
  }

  const originPath = new URL(currentHref);
  const minimal = `${originPath.origin}${originPath.pathname}`;
  const hashUrl = `${minimal}#${new URLSearchParams({ p: encodedPayload }).toString()}`;
  if (hashUrl.length <= MAX_SHARE_URL_LENGTH) {
    return { ok: true, url: hashUrl };
  }

  return { ok: false, reason: 'too_long' };
}

/** Read share payload from `?p=` or hash `#p=` / `#?p=`. */
export function readShareEncodedPayloadFromWindow(search: string, hash: string): string | null {
  const fromSearch = new URLSearchParams(search).get('p');
  if (fromSearch) return fromSearch;

  const h = hash.replace(/^#/, '');
  if (!h) return null;
  const params = new URLSearchParams(h.startsWith('?') ? h.slice(1) : h);
  const fromHash = params.get('p');
  if (fromHash) return fromHash;
  return null;
}

export type LandscapeSharePayload = {
  v: typeof VERSION;
  /**
   * Present on payloads from `buildSharePayload` (v1). When true, marks a **lossy compressed excerpt**
   * for UX sharing only — not interchangeable with a stored research session.
   */
  isCompressed?: true;
  /** Raw scores 0–100 per dimension */
  rp: Record<CognitiveDimension, number>;
  /** Weighted / adjusted scores 0–100 */
  wp: Record<CognitiveDimension, number>;
  /** Final routing confidence 0–1 per dimension only (other confidence fields dropped). */
  fc: Record<CognitiveDimension, number>;
  completedAt?: string;
};

export function buildSharePayload(
  display: DimensionDisplayModel,
  confidenceComponents: ConfidenceComponents,
  completedAt?: string
): LandscapeSharePayload {
  const rp = {} as Record<CognitiveDimension, number>;
  const wp = {} as Record<CognitiveDimension, number>;
  const fc = {} as Record<CognitiveDimension, number>;
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    rp[d] = display.rawPercent[d];
    wp[d] = display.weightedPercent[d];
    fc[d] = confidenceComponents[d].finalConfidence;
  }
  return { v: VERSION, isCompressed: true, rp, wp, fc, completedAt };
}

export function encodeLandscapeSharePayload(payload: LandscapeSharePayload): string {
  const json = JSON.stringify(payload);
  return btoa(encodeURIComponent(json));
}

export function decodeLandscapeSharePayload(encoded: string): LandscapeSharePayload | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const raw = JSON.parse(json) as unknown;
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    if (o.v !== VERSION || typeof o.rp !== 'object' || typeof o.wp !== 'object' || typeof o.fc !== 'object') {
      return null;
    }
    const rp = o.rp as Record<string, number>;
    const wp = o.wp as Record<string, number>;
    const fc = o.fc as Record<string, number>;
    for (const d of COGNITIVE_DIMENSION_KEYS) {
      if (typeof rp[d] !== 'number' || typeof wp[d] !== 'number' || typeof fc[d] !== 'number') return null;
    }
    return {
      v: VERSION,
      isCompressed: true,
      rp: rp as Record<CognitiveDimension, number>,
      wp: wp as Record<CognitiveDimension, number>,
      fc: fc as Record<CognitiveDimension, number>,
      completedAt: typeof o.completedAt === 'string' ? o.completedAt : undefined,
    };
  } catch {
    return null;
  }
}

export function displayModelFromSharePayload(p: LandscapeSharePayload): DimensionDisplayModel {
  const rawPercent = { ...p.rp } as DimensionDisplayModel['rawPercent'];
  const weightedPercent = { ...p.wp } as DimensionDisplayModel['weightedPercent'];
  const itemsContributing = Object.fromEntries(COGNITIVE_DIMENSION_KEYS.map((d) => [d, 0])) as DimensionDisplayModel['itemsContributing'];
  return { rawPercent, weightedPercent, itemsContributing };
}

export function confidenceComponentsFromSharePayload(p: LandscapeSharePayload): ConfidenceComponents {
  const out = {} as ConfidenceComponents;
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    const fc = p.fc[d] ?? 0;
    out[d] = {
      effectiveEvidence: 0,
      reliability: 0,
      consistency: 1,
      finalConfidence: Math.max(0, Math.min(1, fc)),
      meetsMinimumSample: false,
    };
  }
  return out;
}
