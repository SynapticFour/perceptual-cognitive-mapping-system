/**
 * Reference points (archetype / extra) use the same sqrt(weight) band as activations,
 * with a fixed moderate weight so they never read as a dominant “main” marker.
 */
export const FIELD_REFERENCE_SQRT_WEIGHT = Math.sqrt(0.48);

const BASE_R = 2.05;
const SMALL_SCALE = 1.28;

/** Core radius (px, SVG/canvas logical space) aligned with MapView activation dots. */
export function fieldActivationRadiusPx(sqrtWeight: number): number {
  const sw = Math.max(0, sqrtWeight);
  return Math.max(1.85, BASE_R + sw * SMALL_SCALE);
}

/** Thin halo + core for archetype/extra (same family as activations, not oversized). */
export function fieldReferenceGlyphRadiiPx(): { halo: number; core: number } {
  const r = fieldActivationRadiusPx(FIELD_REFERENCE_SQRT_WEIGHT);
  return { halo: r + 0.55, core: r };
}
