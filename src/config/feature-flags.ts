/**
 * Central feature flags (NEXT_PUBLIC_*). All ATLAS flags default off.
 * @see docs/DECISIONS.md
 */

export const FEATURE_FLAGS = {
  // ATLAS features — all off by default
  ATLAS_SELF_NOMINATION:
    process.env.NEXT_PUBLIC_ENABLE_SELF_NOMINATION === 'true',
  ATLAS_VIGNETTE_MODE:
    process.env.NEXT_PUBLIC_ENABLE_VIGNETTE_MODE === 'true',
  ATLAS_IMPUTATION: process.env.NEXT_PUBLIC_ENABLE_ATLAS_IMPUTATION === 'true',

  // PCMS features
  FACILITATOR_VIEW: process.env.NEXT_PUBLIC_ENABLE_FACILITATOR_VIEW === 'true',
  LOCALE_REVIEW_WARNINGS:
    process.env.NEXT_PUBLIC_LOCALE_REVIEW_WARNINGS === 'true',
  VALIDATION_STATUS_BANNER:
    process.env.NEXT_PUBLIC_SHOW_VALIDATION_STATUS === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
