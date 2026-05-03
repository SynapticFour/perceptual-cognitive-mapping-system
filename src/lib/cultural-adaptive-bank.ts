import { COGNITIVE_DIMENSION_KEYS, type CognitiveDimension } from '../model/cognitive-dimensions';
import { primaryRoutingDimension } from './question-validator';
import type { AssessmentQuestion, AssessmentQuestionCategory, QuestionStemRegion } from '../data/questions';

/** Stable id for persistence / exports when this bank supplied the items. */
export const CULTURAL_ADAPTIVE_BANK_ID = 'cultural-adaptive-v1' as const;

/** Content revision; bump when `bank.json` changes incompatibly. */
export const CULTURAL_ADAPTIVE_BANK_CONTENT_VERSION = '1' as const;

/** Tag on every {@link AssessmentQuestion} from this bank; used for session bank inference. */
export const CULTURAL_ADAPTIVE_BANK_TAG = 'cultural_adaptive_v1' as const;

/** Eight research dimensions in `content/questions/cultural-adaptive-v1/bank.json`. */
export const CULTURAL_ADAPTIVE_DIMENSIONS = [
  'sensory_regulation',
  'attention_focus',
  'temporal_pacing',
  'conversation_rhythm',
  'structure_preference',
  'adaptability_change',
  'effort_recovery',
  'learning_expression',
] as const;

export type CulturalAdaptiveDimension = (typeof CULTURAL_ADAPTIVE_DIMENSIONS)[number];

export type CulturalAdaptiveStemKey = QuestionStemRegion;

const DIMENSION_SET = new Set<string>(CULTURAL_ADAPTIVE_DIMENSIONS);

const QUESTION_CATEGORY_VALUES: AssessmentQuestionCategory[] = [
  'focus',
  'pattern',
  'sensory',
  'social',
  'structure',
  'flexibility',
];

function categoryFromTags(tags: string[]): AssessmentQuestionCategory {
  for (const tag of tags) {
    if (QUESTION_CATEGORY_VALUES.includes(tag as AssessmentQuestionCategory)) {
      return tag as AssessmentQuestionCategory;
    }
  }
  return 'focus';
}

/**
 * Pilot routing loadings onto F–V axes (same contract as classic/global banks).
 * Primary axis ≥ 0.6 for {@link AdaptiveQuestionnaireEngine} coverage.
 */
export const CULTURAL_ADAPTIVE_ROUTING_WEIGHTS: Record<
  CulturalAdaptiveDimension,
  Partial<Record<CognitiveDimension, number>>
> = {
  sensory_regulation: { S: 0.68, I: 0.14, F: 0.08, P: 0.05, E: 0.05 },
  attention_focus: { F: 0.68, S: 0.12, T: 0.08, E: 0.07, P: 0.05 },
  temporal_pacing: { T: 0.68, R: 0.14, F: 0.09, C: 0.09 },
  conversation_rhythm: { E: 0.68, F: 0.15, R: 0.09, S: 0.08 },
  structure_preference: { R: 0.68, P: 0.14, C: 0.09, T: 0.09 },
  adaptability_change: { C: 0.68, R: 0.12, T: 0.1, F: 0.1 },
  effort_recovery: { I: 0.68, F: 0.12, P: 0.1, T: 0.1 },
  learning_expression: { V: 0.68, A: 0.14, F: 0.09, P: 0.09 },
};

export interface CulturalAdaptiveBankJsonRow {
  id: string;
  dimension: string;
  reverse: boolean;
  tags: string[];
  variants: Record<string, string>;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Resolve which regional stem bundle to use (JSON `variants.*`). */
export function culturalAdaptiveStemKey(locale: string): CulturalAdaptiveStemKey {
  const raw = process.env.NEXT_PUBLIC_PCMS_CULTURAL_STEM?.trim().toLowerCase();
  if (raw === 'global' || raw === 'ghana' || raw === 'west_africa') {
    return raw;
  }
  const l = locale.toLowerCase();
  if (l === 'ghana' || l === 'gh-en') return 'ghana';
  return 'global';
}

function assertMaxRoutingWeight(
  weights: Partial<Record<CognitiveDimension, number>>,
  id: string,
  label: string
): void {
  const max = Math.max(0, ...COGNITIVE_DIMENSION_KEYS.map((k) => weights[k] ?? 0));
  if (max < 0.6) {
    throw new Error(`${label} [${id}]: cultural-adaptive routing map max weight < 0.6 (got ${max})`);
  }
}

export function culturalAdaptiveRowToAssessmentQuestion(
  row: CulturalAdaptiveBankJsonRow,
  stemKey: CulturalAdaptiveStemKey,
  label: string
): AssessmentQuestion {
  if (!DIMENSION_SET.has(row.dimension)) {
    throw new Error(`${label} [${row.id}]: unknown dimension "${row.dimension}"`);
  }
  const dim = row.dimension as CulturalAdaptiveDimension;
  const text = row.variants[stemKey];
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error(`${label} [${row.id}]: missing variants.${stemKey}`);
  }
  const partial = CULTURAL_ADAPTIVE_ROUTING_WEIGHTS[dim];
  assertMaxRoutingWeight(partial, row.id, label);

  const stemVariants: Record<QuestionStemRegion, string> = {
    global: String(row.variants.global ?? '').trim(),
    ghana: String(row.variants.ghana ?? '').trim(),
    west_africa: String(row.variants.west_africa ?? '').trim(),
  };

  const dimensionWeights = Object.fromEntries(
    COGNITIVE_DIMENSION_KEYS.map((k) => [k, partial[k] ?? 0])
  ) as Record<CognitiveDimension, number>;

  const tags = [
    ...row.tags,
    `dim:${dim}`,
    CULTURAL_ADAPTIVE_BANK_TAG,
    stemKey === 'ghana' ? 'stem:ghana' : stemKey === 'west_africa' ? 'stem:west_africa' : 'stem:global',
  ];

  return {
    id: row.id,
    text,
    stemVariants,
    category: categoryFromTags(row.tags),
    dimensionWeights,
    informationGain: 0.65,
    type: 'core',
    difficulty: 'broad',
    tags,
    culturalContext: 'universal',
    reverseScored: row.reverse,
    responseScale: 'likert3',
  };
}

/**
 * Validate raw JSON from `cultural-adaptive-v1/bank.json` and map to {@link AssessmentQuestion}.
 */
export function validateCulturalAdaptiveBankArray(
  data: unknown,
  label: string,
  localeForStem: string
): AssessmentQuestion[] {
  if (!Array.isArray(data)) {
    throw new Error(`${label}: expected top-level JSON array`);
  }
  if (data.length !== 200) {
    throw new Error(`${label}: expected 200 items, got ${data.length}`);
  }

  const stemKey = culturalAdaptiveStemKey(localeForStem);
  const seen = new Set<string>();
  const byDim: Record<string, number> = Object.fromEntries(
    CULTURAL_ADAPTIVE_DIMENSIONS.map((d) => [d, 0])
  );

  const rows: CulturalAdaptiveBankJsonRow[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const idx = `${label}[${i}]`;
    if (!isRecord(item)) throw new Error(`${idx}: expected object`);
    const id = item.id;
    const dimension = item.dimension;
    const reverse = item.reverse;
    const tags = item.tags;
    const variants = item.variants;
    if (typeof id !== 'string' || !id) throw new Error(`${idx}: missing id`);
    if (seen.has(id)) throw new Error(`${label}: duplicate id "${id}"`);
    seen.add(id);
    if (typeof dimension !== 'string' || !DIMENSION_SET.has(dimension)) {
      throw new Error(`${label} [${id}]: invalid dimension`);
    }
    if (typeof reverse !== 'boolean') throw new Error(`${label} [${id}]: reverse must be boolean`);
    if (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string')) {
      throw new Error(`${label} [${id}]: tags must be string[]`);
    }
    if (!isRecord(variants)) throw new Error(`${label} [${id}]: variants must be object`);
    for (const k of ['global', 'ghana', 'west_africa'] as const) {
      const s = variants[k];
      if (typeof s !== 'string' || !s.trim()) {
        throw new Error(`${label} [${id}]: variants.${k} must be non-empty string`);
      }
    }
    byDim[dimension] += 1;
    rows.push({
      id,
      dimension,
      reverse,
      tags: tags as string[],
      variants: variants as Record<string, string>,
    });
  }

  for (const d of CULTURAL_ADAPTIVE_DIMENSIONS) {
    if (byDim[d] !== 25) {
      throw new Error(`${label}: expected 25 items per dimension "${d}", got ${byDim[d]}`);
    }
  }

  const mapped = rows.map((row) => culturalAdaptiveRowToAssessmentQuestion(row, stemKey, label));
  assertCulturalAdaptiveBankConstraints(mapped, label);
  return mapped;
}

/**
 * Lighter than {@link assertResearchBankConstraints}: this bank maps eight constructs to eight
 * primary F–V axes (P/A are not primaries), so the classic “every F–V key ≥2 reverse-primary” rule does not apply.
 */
export function assertCulturalAdaptiveBankConstraints(questions: AssessmentQuestion[], label: string): void {
  const reverseBySlug: Record<string, number> = Object.fromEntries(
    CULTURAL_ADAPTIVE_DIMENSIONS.map((d) => [d, 0])
  );

  const reverseByPrimaryFv: Partial<Record<CognitiveDimension, number>> = {};

  for (const q of questions) {
    const dimTag = q.tags.find((t) => t.startsWith('dim:'));
    const slug = dimTag?.slice(4);
    if (slug && reverseBySlug[slug] !== undefined && q.reverseScored) {
      reverseBySlug[slug] += 1;
    }
    const primary = primaryRoutingDimension(q.dimensionWeights);
    if (primary && q.reverseScored) {
      reverseByPrimaryFv[primary] = (reverseByPrimaryFv[primary] ?? 0) + 1;
    }
  }

  for (const d of CULTURAL_ADAPTIVE_DIMENSIONS) {
    if (reverseBySlug[d] < 2) {
      throw new Error(
        `${label}: cultural dimension "${d}" needs ≥2 reverse-scored items (got ${reverseBySlug[d]})`
      );
    }
  }

  const primariesUsed: CognitiveDimension[] = ['S', 'F', 'T', 'E', 'R', 'C', 'I', 'V'];
  for (const k of primariesUsed) {
    const n = reverseByPrimaryFv[k] ?? 0;
    if (n < 2) {
      throw new Error(
        `${label}: primary routing axis "${k}" needs ≥2 reverse-scored items (got ${n}). Adjust weights or stems.`
      );
    }
  }
}
