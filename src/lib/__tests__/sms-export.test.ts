import { describe, expect, it } from 'vitest';
import { COGNITIVE_DIMENSION_KEYS } from '@/model/cognitive-dimensions';
import { decodeProfileVectorCode, encodeProfileVectorCode } from '@/lib/sms-export';

describe('sms-export', () => {
  it('round-trips ten dimensions', () => {
    const raw = Object.fromEntries(COGNITIVE_DIMENSION_KEYS.map((k, i) => [k, i * 10])) as Record<
      (typeof COGNITIVE_DIMENSION_KEYS)[number],
      number
    >;
    const code = encodeProfileVectorCode(raw);
    expect(code).toMatch(/^([FPSERCTIAV][0-9]){10}$/i);
    const decoded = decodeProfileVectorCode(code);
    expect(decoded).not.toBeNull();
    for (const k of COGNITIVE_DIMENSION_KEYS) {
      expect(decoded![k]).toBeGreaterThanOrEqual(0);
      expect(decoded![k]).toBeLessThanOrEqual(100);
    }
  });

  it('rejects incomplete codes', () => {
    expect(decodeProfileVectorCode('F5P5')).toBeNull();
  });
});
