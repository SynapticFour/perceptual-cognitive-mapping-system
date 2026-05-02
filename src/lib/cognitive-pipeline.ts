/**
 * End-to-end research pipeline wiring (raw → features → embedding → public interpretation).
 * Questionnaire completion persists `StoredPipelineSession` (see `toStoredPipelineSession`).
 */

import type { AssessmentQuestion, QuestionResponse } from '@/data/questions';
import { getAssessmentQuestions } from '@/data/questions';
import { ScoringModel, type ScoringModelConfig, type ScoringResult } from '@/scoring';
import { LatentRepresentationManager } from '@/model';
import type { CognitiveFeatures, LatentCognitiveVector } from '@/model';
import type { RawResponse, SessionRaw } from '@/types/raw-session';
import type { CognitiveProfilePublic } from '@/types/profile-public';
import { interpretCognitiveFeatures } from '@/lib/interpretation';
import { defaultUiStrings } from '@/lib/ui-strings';
import { PIPELINE_STORAGE_VERSION, type StoredPipelineSession } from '@/types/pipeline-session';
import type { EightConstructOutcome } from '@/types/eight-construct-outcome';

export function questionResponseToRawResponse(question: AssessmentQuestion, qr: QuestionResponse): RawResponse {
  const type = question.type;
  const difficulty = question.difficulty;
  const tags = question.tags.length ? question.tags : [question.category];

  return {
    questionId: qr.questionId,
    selectedAnswer: qr.response,
    responseTime: qr.responseTimeMs,
    timestamp: qr.timestamp.getTime(),
    questionContext: {
      category: question.category,
      difficulty,
      type,
      tags,
    },
  };
}

export type QuestionResolveResult = {
  question: AssessmentQuestion;
};

/**
 * Build a resolver from the canonical assessment question bank.
 */
export function createResearchQuestionResolver(
  culturalContext: 'western' | 'ghana' | 'universal' = 'universal'
): (questionId: string) => QuestionResolveResult | undefined {
  const bank = getAssessmentQuestions('all', culturalContext);
  const byId = new Map(bank.map((q) => [q.id, q]));

  return (questionId: string) => {
    const q = byId.get(questionId);
    if (!q) return undefined;
    return { question: q };
  };
}

export function buildSessionRawFromHistory(
  sessionId: string,
  history: QuestionResponse[],
  resolve: (questionId: string) => QuestionResolveResult | undefined
): SessionRaw {
  const responses: RawResponse[] = [];
  for (const qr of history) {
    const meta = resolve(qr.questionId);
    if (!meta) continue;
    responses.push(questionResponseToRawResponse(meta.question, qr));
  }
  return { sessionId, responses };
}

export async function runResearchPipeline(
  session: SessionRaw,
  options?: { targetDimension?: number }
): Promise<{
  features: CognitiveFeatures;
  embedding: LatentCognitiveVector;
  publicProfile: CognitiveProfilePublic;
}> {
  const manager = new LatentRepresentationManager(undefined, options?.targetDimension ?? 64);
  const embedding = await manager.generateLatentVector(session.responses, {});
  const publicProfile = interpretCognitiveFeatures(embedding.features, defaultUiStrings);
  return {
    features: embedding.features,
    embedding,
    publicProfile,
  };
}

export type ResearchPipelineOutput = Awaited<ReturnType<typeof runResearchPipeline>>;

export function buildScoringResultFromHistory(
  history: QuestionResponse[],
  culturalContext: 'western' | 'ghana' | 'universal' = 'universal',
  scoringConfig?: Partial<ScoringModelConfig>
): ScoringResult {
  const bank = getAssessmentQuestions('all', culturalContext);
  const questionsById = new Map(bank.map((q) => [q.id, q]));
  const model = new ScoringModel(scoringConfig);
  return model.evaluate(history, questionsById);
}

/** Serialize pipeline output for UI / persistence (no legacy 6D vector). */
export function toStoredPipelineSession(
  pipeline: ResearchPipelineOutput,
  responseCount: number,
  completedAt: string = new Date().toISOString(),
  scoringResult: ScoringResult,
  sessionMeta?: {
    sessionId?: string;
    revision?: number;
    eightConstructScores?: EightConstructOutcome | null;
  }
): StoredPipelineSession {
  const { embedding, publicProfile, features } = pipeline;
  const out: StoredPipelineSession = {
    version: PIPELINE_STORAGE_VERSION,
    sessionId: sessionMeta?.sessionId,
    revision: sessionMeta?.revision ?? 0,
    completedAt,
    responseCount,
    publicProfile,
    embedding: {
      dimension: embedding.dimension,
      version: embedding.version,
      confidence: embedding.confidence,
      vector: embedding.vector,
    },
    featureHighlights: {
      overallConfidence: features.overallConfidence,
      answerConsistency: features.answerConsistency,
      entropy: features.entropy,
    },
    scoringResult,
  };
  if (sessionMeta?.eightConstructScores) {
    out.eightConstructScores = sessionMeta.eightConstructScores;
  }
  return out;
}
