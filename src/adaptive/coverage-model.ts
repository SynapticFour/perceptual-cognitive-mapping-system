/**
 * Question routing coverage — uses fixed routing weight keys (F…V) only as **opaque tags**
 * for adaptive selection. This is not a cognitive representation layer.
 */

import type { AssessmentQuestion, QuestionResponse } from '@/data/questions';
import type { ScoringModel } from '@/scoring';
import { tagCoverageFromScoringResult } from '@/scoring';
import {
  ROUTING_WEIGHT_KEYS,
  type RoutingWeightKey,
  type TagCoverageVector,
  emptyTagCoverage,
} from '@/adaptive/routing-tags';

export { ROUTING_WEIGHT_KEYS, type RoutingWeightKey, type TagCoverageVector, emptyTagCoverage };

export interface ResearchCoverageConfig {
  researchConfidenceThreshold: number;
  maxQuestionsPerDimension: number;
  /**
   * `majority` (default): stop when ≥70% of routing dimensions meet the threshold (efficiency).
   * `all`: every routing dimension must reach the threshold (stricter; more questions on average).
   */
  stoppingRule?: 'majority' | 'all';
}

const DEFAULT_CONFIG: ResearchCoverageConfig = {
  researchConfidenceThreshold: 0.75,
  maxQuestionsPerDimension: 5,
  stoppingRule: 'majority',
};

export class CoverageModel {
  constructor(private readonly config: ResearchCoverageConfig = DEFAULT_CONFIG) {}

  /**
   * Authoritative per-tag confidence from the scoring model (CTT-style evidence + consistency).
   */
  coverageVectorFromResponses(
    responses: QuestionResponse[],
    questions: AssessmentQuestion[],
    scoringModel: ScoringModel
  ): TagCoverageVector {
    const questionsById = new Map(questions.map((q) => [q.id, q]));
    const result = scoringModel.evaluate(responses, questionsById);
    return tagCoverageFromScoringResult(result);
  }

  /**
   * Legacy: counts items with routing weight ≥ 0.3 per tag (used for balancing, not confidence).
   */
  countQuestionsPerTag(responses: QuestionResponse[], questions: AssessmentQuestion[]): TagCoverageVector {
    const counts = emptyTagCoverage();
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    for (const response of responses) {
      const question = questionMap.get(response.questionId);
      if (!question) continue;

      for (const tag of ROUTING_WEIGHT_KEYS) {
        const weight = question.dimensionWeights[tag] ?? 0;
        if (weight >= 0.3) counts[tag]++;
      }
    }
    return counts;
  }

  meetsResearchThresholds(confidence: TagCoverageVector): {
    meetsThreshold: boolean;
    tagsMet: RoutingWeightKey[];
    tagsBelowThreshold: RoutingWeightKey[];
    overallCoverage: number;
  } {
    const tagsMet: RoutingWeightKey[] = [];
    const tagsBelowThreshold: RoutingWeightKey[] = [];

    for (const tag of ROUTING_WEIGHT_KEYS) {
      if (confidence[tag] >= this.config.researchConfidenceThreshold) {
        tagsMet.push(tag);
      } else {
        tagsBelowThreshold.push(tag);
      }
    }

    const overallCoverage = tagsMet.length / ROUTING_WEIGHT_KEYS.length;
    const rule = this.config.stoppingRule ?? 'majority';
    const meetsThreshold =
      rule === 'all'
        ? tagsBelowThreshold.length === 0
        : overallCoverage >= 0.7;

    return { meetsThreshold, tagsMet, tagsBelowThreshold, overallCoverage };
  }

  getNextTargetTag(
    confidence: TagCoverageVector,
    available: readonly RoutingWeightKey[] = ROUTING_WEIGHT_KEYS
  ): RoutingWeightKey | null {
    const sorted = [...available]
      .filter((tag) => confidence[tag] < this.config.researchConfidenceThreshold)
      .sort((a, b) => confidence[a] - confidence[b]);
    return sorted.length > 0 ? sorted[0]! : null;
  }

  averageCoverage(confidence: TagCoverageVector): number {
    const sum = ROUTING_WEIGHT_KEYS.reduce((acc, tag) => acc + confidence[tag], 0);
    return sum / ROUTING_WEIGHT_KEYS.length;
  }
}
