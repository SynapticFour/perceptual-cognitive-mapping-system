import type { ProfileAdaptiveConfig } from '@/adaptive/profile-adaptive';

function readPublicNumber(name: string): number | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined;
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Field-study overrides via `NEXT_PUBLIC_PCMS_PROFILE_*` (inlined in client bundles).
 * Merged onto {@link DEFAULT_PROFILE_ADAPTIVE_CONFIG} in the adaptive engine.
 */
export function profileAdaptiveConfigFromEnv(): Partial<ProfileAdaptiveConfig> {
  const out: Partial<ProfileAdaptiveConfig> = {};
  const sessionThreshold = readPublicNumber('NEXT_PUBLIC_PCMS_PROFILE_SESSION_THRESHOLD');
  const minAnswers = readPublicNumber('NEXT_PUBLIC_PCMS_PROFILE_MIN_ANSWERS');
  const nHalf = readPublicNumber('NEXT_PUBLIC_PCMS_PROFILE_N_HALF');
  const nCap = readPublicNumber('NEXT_PUBLIC_PCMS_PROFILE_N_CAP');
  const wContradiction = readPublicNumber('NEXT_PUBLIC_PCMS_PROFILE_W_CONTRADICTION');
  const dimWindow = readPublicNumber('NEXT_PUBLIC_PCMS_PROFILE_DIMINISHING_WINDOW');
  const dimEpsilon = readPublicNumber('NEXT_PUBLIC_PCMS_PROFILE_DIMINISHING_EPSILON');
  const legacyBlend = readPublicNumber('NEXT_PUBLIC_PCMS_PROFILE_LEGACY_BLEND');

  if (sessionThreshold !== undefined) out.sessionConfidenceThreshold = sessionThreshold;
  if (minAnswers !== undefined) out.minTotalAnswersForProfileStop = minAnswers;
  if (nHalf !== undefined) out.nHalfPerDimension = nHalf;
  if (nCap !== undefined) out.nCapPerDimension = nCap;
  if (wContradiction !== undefined) out.wContradiction = wContradiction;
  if (dimWindow !== undefined) out.diminishingReturnsWindow = dimWindow;
  if (dimEpsilon !== undefined) out.diminishingReturnsEpsilon = dimEpsilon;
  if (legacyBlend !== undefined) out.coreLegacyBlend = legacyBlend;

  return out;
}
