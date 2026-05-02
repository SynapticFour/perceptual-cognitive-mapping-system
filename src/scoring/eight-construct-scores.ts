/**
 * Eight-construct (g8) scale scores from a single administration.
 * For sample-level reliability (McDonald's ω, Cronbach's α) and IRT, see calibration pipeline in docs.
 */

import type { QuestionResponse } from '@/data/questions';
import { normalizeLikertResponse } from '@/data/questions';
import type { AssessmentQuestion } from '@/data/questions';
import { adjustedNormalizedResponse } from './scoring-model';
import {
  EIGHT_CONSTRUCT_IDS,
  type EightConstructId,
  isEightConstructId,
} from '@/model/eight-constructs';
import {
  EIGHT_CONSTRUCT_OUTCOME_VERSION,
  type EightConstructOutcome,
  type EightConstructScaleScore,
} from '@/types/eight-construct-outcome';

function g8ConstructFromTags(tags: string[]): EightConstructId | null {
  for (const t of tags) {
    if (!t.startsWith('g8:')) continue;
    const id = t.slice(3);
    if (isEightConstructId(id)) return id;
  }
  return null;
}

function populationStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const m = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length;
}

function sqrtSafe(x: number): number {
  return x > 0 ? Math.sqrt(x) : 0;
}

/**
 * Computes per-construct means from items tagged `g8:<construct>`.
 * Returns `null` if the history contains no g8-tagged items (classic bank).
 */
export function computeEightConstructScores(
  history: QuestionResponse[],
  questionsById: Map<string, AssessmentQuestion>
): EightConstructOutcome | null {
  const buckets: Record<EightConstructId, number[]> = {
    predictability_adaptivity: [],
    sensory_processing: [],
    cognitive_framing: [],
    social_orientation: [],
    information_load: [],
    temporal_processing: [],
    self_regulation: [],
    motivation: [],
  };

  let anyG8 = false;

  for (const qr of history) {
    const q = questionsById.get(qr.questionId);
    if (!q) continue;
    const c = g8ConstructFromTags(q.tags);
    if (!c) continue;
    anyG8 = true;
    const norm = normalizeLikertResponse(qr.response, q.responseScale ?? 'likert5');
    const adj = adjustedNormalizedResponse(norm, q.reverseScored ?? false);
    buckets[c].push(adj);
  }

  if (!anyG8) return null;

  const scales = {} as Record<EightConstructId, EightConstructScaleScore>;

  for (const id of EIGHT_CONSTRUCT_IDS) {
    const vals = buckets[id];
    const n = vals.length;
    if (n === 0) {
      scales[id] = {
        construct: id,
        nItems: 0,
        mean01: null,
        withinPersonItemSd: null,
        meanSemWithinPerson: null,
      };
      continue;
    }
    const mean = vals.reduce((s, v) => s + v, 0) / n;
    const variance = populationStdDev(vals);
    const sd = sqrtSafe(variance);
    scales[id] = {
      construct: id,
      nItems: n,
      mean01: Math.round(mean * 10000) / 10000,
      withinPersonItemSd: Math.round(sd * 10000) / 10000,
      meanSemWithinPerson: n > 0 ? Math.round((sd / sqrtSafe(n)) * 10000) / 10000 : null,
    };
  }

  return {
    schemaVersion: EIGHT_CONSTRUCT_OUTCOME_VERSION,
    bankId: 'global_behavioral_v2',
    scales,
  };
}
