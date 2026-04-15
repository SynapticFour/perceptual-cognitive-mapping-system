/**
 * Compact alphanumeric encoding of routing-dimension **display** scores for SMS handoff.
 *
 * **Twilio / SMS backend:** This module only encodes/decodes a short string client-side.
 * Sending SMS requires a server route with Twilio (or similar) credentials — not included here.
 */

import { COGNITIVE_DIMENSION_KEYS, type CognitiveDimension } from '@/model/cognitive-dimensions';

const DIM_SET = new Set<string>(COGNITIVE_DIMENSION_KEYS);

/** One digit 0–9 ≈ deciles of 0–100% (coarse; for human relay, not cryptography). */
function percentToDigit(p: number): string {
  const clamped = Math.max(0, Math.min(100, p));
  const d = Math.min(9, Math.floor(clamped / 10.0001));
  return String(d);
}

function digitToPercent(d: string): number {
  const n = parseInt(d, 10);
  if (!Number.isFinite(n) || n < 0 || n > 9) return 50;
  return Math.min(100, n * 10 + 5);
}

/**
 * Encodes ten dimensions as `F7P8S3E4R9C5T6I4A7V8` (letter + digit per axis).
 * `rawPercent` keys should include F…V (0–100).
 */
export function encodeProfileVectorCode(rawPercent: Partial<Record<CognitiveDimension, number>>): string {
  return COGNITIVE_DIMENSION_KEYS.map((k) => {
    const p = rawPercent[k] ?? 50;
    return `${k}${percentToDigit(p)}`;
  }).join('');
}

export type DecodedSmsVector = Record<CognitiveDimension, number>;

/**
 * Parses a code from {@link encodeProfileVectorCode}. Whitespace-insensitive.
 * Returns `null` if not all ten dimensions are present.
 */
export function decodeProfileVectorCode(code: string): DecodedSmsVector | null {
  const clean = code.replace(/\s+/g, '').toUpperCase();
  const found = new Map<string, number>();
  for (let i = 0; i < clean.length - 1; i += 2) {
    const letter = clean[i];
    const digit = clean[i + 1];
    if (!letter || !digit) break;
    if (!DIM_SET.has(letter)) continue;
    if (digit < '0' || digit > '9') return null;
    found.set(letter, digitToPercent(digit));
  }
  for (const k of COGNITIVE_DIMENSION_KEYS) {
    if (!found.has(k)) return null;
  }
  return Object.fromEntries(found) as DecodedSmsVector;
}
