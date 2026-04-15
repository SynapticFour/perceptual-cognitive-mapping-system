import { COGNITIVE_DIMENSION_KEYS, type CognitiveDimension } from '@/model/cognitive-dimensions';
import type { ConfidenceComponents } from '@/scoring';
import type { DimensionDisplayModel } from '@/lib/dimension-display';

const VERSION = 1 as const;

export type LandscapeSharePayload = {
  v: typeof VERSION;
  /** Raw scores 0–100 per dimension */
  rp: Record<CognitiveDimension, number>;
  /** Weighted / adjusted scores 0–100 */
  wp: Record<CognitiveDimension, number>;
  /** Final routing confidence 0–1 */
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
  return { v: VERSION, rp, wp, fc, completedAt };
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
