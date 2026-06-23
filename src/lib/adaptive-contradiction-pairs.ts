/**
 * Research-only: flag item pairs on the same routing dimension with large score divergence.
 * Not shown in user-facing UI; included in full-session exports when enabled.
 */
import type { AssessmentQuestion, QuestionResponse } from '@/data/questions';
import { normalizeLikertResponse } from '@/data/questions';
import { adjustedNormalizedResponse } from '@/scoring';
import { primaryRoutingKeyForProfile } from '@/adaptive/profile-adaptive';

export type ContradictoryItemPairFlag = {
  questionIdA: string;
  questionIdB: string;
  routingDimension: string;
  scoreA01: number;
  scoreB01: number;
  /** |scoreA - scoreB| on adjusted 0–1 scale. */
  delta01: number;
};

const DEFAULT_PAIR_DELTA_THRESHOLD = 0.55;

function codedScore(response: QuestionResponse, question: AssessmentQuestion): number {
  const scale = question.responseScale ?? 'likert5';
  const norm = normalizeLikertResponse(response.response, scale);
  return adjustedNormalizedResponse(norm, question.reverseScored ?? false);
}

/**
 * Within-session pairs on the same primary routing key exceeding `deltaThreshold`.
 * O(n²) over answered items — fine for ≤30 responses per session.
 */
export function findContradictoryItemPairs(
  responses: QuestionResponse[],
  questionsById: Map<string, AssessmentQuestion>,
  deltaThreshold: number = DEFAULT_PAIR_DELTA_THRESHOLD
): ContradictoryItemPairFlag[] {
  const coded: { id: string; dim: string; score: number }[] = [];
  for (const r of responses) {
    const q = questionsById.get(r.questionId);
    if (!q) continue;
    coded.push({
      id: r.questionId,
      dim: primaryRoutingKeyForProfile(q),
      score: codedScore(r, q),
    });
  }

  const out: ContradictoryItemPairFlag[] = [];
  for (let i = 0; i < coded.length; i++) {
    for (let j = i + 1; j < coded.length; j++) {
      const a = coded[i]!;
      const b = coded[j]!;
      if (a.dim !== b.dim) continue;
      const delta = Math.abs(a.score - b.score);
      if (delta >= deltaThreshold) {
        out.push({
          questionIdA: a.id,
          questionIdB: b.id,
          routingDimension: a.dim,
          scoreA01: Math.round(a.score * 10000) / 10000,
          scoreB01: Math.round(b.score * 10000) / 10000,
          delta01: Math.round(delta * 10000) / 10000,
        });
      }
    }
  }
  return out.sort((x, y) => y.delta01 - x.delta01);
}
