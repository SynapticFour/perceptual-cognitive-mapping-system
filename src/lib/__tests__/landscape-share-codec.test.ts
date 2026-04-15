import { describe, expect, it } from 'vitest';
import { COGNITIVE_DIMENSION_KEYS } from '@/model/cognitive-dimensions';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import type { ConfidenceComponents } from '@/scoring';
import {
  buildSharePayload,
  confidenceComponentsFromSharePayload,
  decodeLandscapeSharePayload,
  displayModelFromSharePayload,
  encodeLandscapeSharePayload,
} from '@/lib/landscape-share-codec';

function makeDisplay(value = 50): DimensionDisplayModel {
  const rawPercent = Object.fromEntries(COGNITIVE_DIMENSION_KEYS.map((d) => [d, value])) as DimensionDisplayModel['rawPercent'];
  const weightedPercent = Object.fromEntries(COGNITIVE_DIMENSION_KEYS.map((d) => [d, value + 1])) as DimensionDisplayModel['weightedPercent'];
  const itemsContributing = Object.fromEntries(COGNITIVE_DIMENSION_KEYS.map((d) => [d, 1])) as DimensionDisplayModel['itemsContributing'];
  return { rawPercent, weightedPercent, itemsContributing };
}

function makeConfidence(value = 0.6): ConfidenceComponents {
  return Object.fromEntries(
    COGNITIVE_DIMENSION_KEYS.map((d) => [
      d,
      {
        effectiveEvidence: 1,
        reliability: 1,
        consistency: 1,
        finalConfidence: value,
        meetsMinimumSample: true,
      },
    ])
  ) as ConfidenceComponents;
}

describe('landscape-share-codec', () => {
  it('round-trips share payload via encode/decode', () => {
    const payload = buildSharePayload(makeDisplay(40), makeConfidence(0.7), '2026-04-13T10:00:00Z');
    const encoded = encodeLandscapeSharePayload(payload);
    const decoded = decodeLandscapeSharePayload(encoded);
    expect(decoded).toEqual(payload);
  });

  it('rejects malformed or invalid payload data', () => {
    expect(decodeLandscapeSharePayload('not-base64')).toBeNull();
    const bad = encodeLandscapeSharePayload({
      v: 999 as 1,
      rp: {} as Record<(typeof COGNITIVE_DIMENSION_KEYS)[number], number>,
      wp: {} as Record<(typeof COGNITIVE_DIMENSION_KEYS)[number], number>,
      fc: {} as Record<(typeof COGNITIVE_DIMENSION_KEYS)[number], number>,
    });
    expect(decodeLandscapeSharePayload(bad)).toBeNull();
  });

  it('reconstructs display and clamps confidence components', () => {
    const payload = buildSharePayload(makeDisplay(55), makeConfidence(0.5));
    payload.fc.F = 2;
    payload.fc.P = -1;

    const display = displayModelFromSharePayload(payload);
    const conf = confidenceComponentsFromSharePayload(payload);

    expect(display.rawPercent.F).toBe(55);
    expect(display.weightedPercent.F).toBe(56);
    expect(conf.F.finalConfidence).toBe(1);
    expect(conf.P.finalConfidence).toBe(0);
  });
});
