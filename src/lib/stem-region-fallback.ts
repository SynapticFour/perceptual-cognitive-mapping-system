import type { QuestionStemRegion } from '@/data/questions';

/** Ordered fallback when a regional bundle is missing or empty. */
export const STEM_REGION_FALLBACK_CHAIN: Record<QuestionStemRegion, readonly QuestionStemRegion[]> = {
  global: [],
  ghana: ['global'],
  west_africa: ['global'],
  francophone_west_africa: ['west_africa', 'global'],
  east_africa: ['global'],
};

export const ALL_QUESTION_STEM_REGIONS: readonly QuestionStemRegion[] = [
  'global',
  'ghana',
  'west_africa',
  'francophone_west_africa',
  'east_africa',
];

const STEM_ENV_KEYS = ALL_QUESTION_STEM_REGIONS;

/** Resolve which regional stem bundle to use from UI locale or env override. */
export function culturalAdaptiveStemKey(locale: string): QuestionStemRegion {
  const raw =
    typeof process !== 'undefined' && process.env
      ? process.env.NEXT_PUBLIC_PCMS_CULTURAL_STEM?.trim().toLowerCase()
      : undefined;
  if (raw && (STEM_ENV_KEYS as readonly string[]).includes(raw)) {
    return raw as QuestionStemRegion;
  }
  const l = locale.toLowerCase();
  if (l === 'ghana' || l === 'gh-en' || l === 'tw') return 'ghana';
  if (l === 'fr' || l === 'wo') return 'francophone_west_africa';
  if (l === 'sw') return 'east_africa';
  return 'global';
}

export function isQuestionStemRegion(value: unknown): value is QuestionStemRegion {
  return typeof value === 'string' && (ALL_QUESTION_STEM_REGIONS as readonly string[]).includes(value);
}
