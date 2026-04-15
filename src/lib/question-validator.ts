import Ajv2020 from 'ajv/dist/2020.js';

import { COGNITIVE_DIMENSION_KEYS, type CognitiveDimension } from '../model/cognitive-dimensions';
import {
  jsonEntryToAssessmentQuestion,
  type AssessmentQuestion,
  type QuestionBankJsonEntry,
} from '../data/questions';
import schemaJson from '../../content/questions/schema.json';

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateQuestionFile = ajv.compile(schemaJson as object);

function assertDimensionWeightsRange(entry: QuestionBankJsonEntry, label: string): void {
  for (const [k, v] of Object.entries(entry.dimension_weights)) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) {
      throw new Error(`${label} [${entry.id}]: dimension_weights.${k} must be a finite number in [0, 1]`);
    }
  }
}

/** At least one routing dimension should carry the item (primary loading > 0.6). */
function assertPrimaryLoading(entry: QuestionBankJsonEntry, label: string): void {
  const max = Math.max(0, ...Object.values(entry.dimension_weights).map((v) => (typeof v === 'number' ? v : 0)));
  if (max < 0.6) {
    throw new Error(`${label} [${entry.id}]: expected at least one dimension weight ≥ 0.6, got max=${max}`);
  }
}

function assertInformationGainRange(entry: QuestionBankJsonEntry, label: string): void {
  const ig = entry.informationGain;
  if (typeof ig !== 'number' || ig < 0.5 || ig > 0.9) {
    throw new Error(`${label} [${entry.id}]: informationGain must be in [0.5, 0.9] for this bank (got ${ig})`);
  }
}

/** Argmax dimension among weights; only counts as primary if max ≥ threshold. */
export function primaryRoutingDimension(
  weights: Record<string, number>,
  threshold = 0.6
): CognitiveDimension | null {
  let best: CognitiveDimension | null = null;
  let max = 0;
  for (const k of COGNITIVE_DIMENSION_KEYS) {
    const w = weights[k] ?? 0;
    if (w > max) {
      max = w;
      best = k;
    }
  }
  return max >= threshold ? best : null;
}

/**
 * Full merged bank checks: each routing dimension should have ≥2 reverse-scored items
 * where that dimension is the primary loading (max weight ≥ 0.6).
 */
export function assertResearchBankConstraints(questions: AssessmentQuestion[], label: string): void {
  const reversePrimaryCount = Object.fromEntries(COGNITIVE_DIMENSION_KEYS.map((k) => [k, 0])) as Record<
    CognitiveDimension,
    number
  >;

  for (const q of questions) {
    const primary = primaryRoutingDimension(q.dimensionWeights);
    if (!primary || !q.reverseScored) continue;
    reversePrimaryCount[primary] += 1;
  }

  const short: string[] = [];
  for (const d of COGNITIVE_DIMENSION_KEYS) {
    if (reversePrimaryCount[d] < 2) {
      short.push(`${d}:${reversePrimaryCount[d]}`);
    }
  }
  if (short.length) {
    throw new Error(
      `${label}: each dimension needs ≥2 reverse-scored questions with that dimension as primary (max w≥0.6). ` +
        `Shortfall: ${short.join(', ')}`
    );
  }
}

/**
 * Validates a single JSON question file against `content/questions/schema.json` (Ajv 2020-12),
 * then applies numeric and research-shape rules before mapping to {@link AssessmentQuestion}.
 */
export function validateQuestionBankArray(data: unknown, label: string): AssessmentQuestion[] {
  if (!validateQuestionFile(data)) {
    const detail = validateQuestionFile.errors ? ajv.errorsText(validateQuestionFile.errors) : 'unknown schema error';
    throw new Error(`Question bank validation failed for ${label}: ${detail}`);
  }
  const rows = data as QuestionBankJsonEntry[];
  for (const row of rows) {
    assertDimensionWeightsRange(row, label);
    assertPrimaryLoading(row, label);
    assertInformationGainRange(row, label);
  }
  return rows.map((row) => jsonEntryToAssessmentQuestion(row));
}
