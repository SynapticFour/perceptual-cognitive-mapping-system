import Ajv2020 from 'ajv/dist/2020.js';

import { COGNITIVE_DIMENSION_KEYS, type CognitiveDimension } from '../model/cognitive-dimensions';
import {
  jsonEntryToAssessmentQuestion,
  type AssessmentQuestion,
  type QuestionBankJsonEntry,
} from '../data/questions';
import schemaJson from '../../content/questions/schema.json';
import { isEightConstructId } from '../model/eight-constructs';

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateQuestionFile = ajv.compile(schemaJson as object);

function assertDimensionWeightsRange(entry: QuestionBankJsonEntry, label: string): void {
  for (const [k, v] of Object.entries(entry.dimension_weights)) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) {
      throw new Error(`${label} [${entry.id}]: dimension_weights.${k} must be a finite number in [0, 1]`);
    }
  }
}

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

/** Argmax among F..V weights. */
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
 * Global behavioral v2 bank: each eight-construct tag (`g8:<id>`) must have ≥2 reverse-coded items.
 * Routing reverse counts (F..V) are not enforced here — constructs deliberately emphasize a subset of axes.
 */
export function assertGlobalBehavioralBankConstraints(questions: AssessmentQuestion[], label: string): void {
  const byConstruct: Record<string, { total: number; reverse: number }> = {};

  for (const q of questions) {
    const g8 = q.tags.find((t) => t.startsWith('g8:'));
    if (!g8) continue;
    const id = g8.slice(3);
    if (!isEightConstructId(id)) continue;
    if (!byConstruct[id]) byConstruct[id] = { total: 0, reverse: 0 };
    byConstruct[id].total += 1;
    if (q.reverseScored) byConstruct[id].reverse += 1;
  }

  const short: string[] = [];
  for (const id of Object.keys(byConstruct)) {
    if (byConstruct[id].reverse < 2) {
      short.push(`${id}:${byConstruct[id].reverse}`);
    }
  }
  if (short.length) {
    throw new Error(
      `${label}: each g8 construct needs ≥2 reverse-scored items. Shortfall: ${short.join(', ')}`
    );
  }
}

export function validateGlobalBehavioralBankArray(data: unknown, label: string): AssessmentQuestion[] {
  if (!validateQuestionFile(data)) {
    const detail = validateQuestionFile.errors ? ajv.errorsText(validateQuestionFile.errors) : 'unknown schema error';
    throw new Error(`Global behavioral bank validation failed for ${label}: ${detail}`);
  }
  const rows = data as QuestionBankJsonEntry[];
  for (const row of rows) {
    assertDimensionWeightsRange(row, label);
    assertPrimaryLoading(row, label);
    assertInformationGainRange(row, label);
  }
  const mapped = rows.map((row) => jsonEntryToAssessmentQuestion(row));
  assertGlobalBehavioralBankConstraints(mapped, label);
  return mapped;
}
