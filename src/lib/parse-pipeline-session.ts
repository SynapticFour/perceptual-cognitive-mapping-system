import { isRecord } from './type-guards';
import type { CognitiveProfilePublic } from '@/types/profile-public';
import {
  PROFILE_ADAPTIVE_SESSION_SUMMARY_VERSION,
  type ProfileAdaptiveSessionSummary,
} from '@/adaptive/profile-adaptive';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import type { QuestionStemRegion } from '@/data/questions';
import type { ResolvedAdaptiveMode } from '@/lib/adaptive-mode-resolution';
import { PIPELINE_STORAGE_VERSION, type StoredPipelineSession } from '@/types/pipeline-session';
import type { ScoringResult } from '@/scoring';
import {
  EIGHT_CONSTRUCT_IDS,
  type EightConstructId,
} from '@/model/eight-constructs';
import type { EightConstructOutcome, EightConstructScaleScore } from '@/types/eight-construct-outcome';
import { EIGHT_CONSTRUCT_OUTCOME_VERSION } from '@/types/eight-construct-outcome';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((x) => typeof x === 'number' && Number.isFinite(x));
}

function isPublicProfile(value: unknown): value is CognitiveProfilePublic {
  if (!isRecord(value)) return false;
  if (typeof value.summary !== 'string') return false;
  if (!Array.isArray(value.patterns) || !value.patterns.every((p) => typeof p === 'string')) return false;
  if (!Array.isArray(value.notes) || !value.notes.every((n) => typeof n === 'string')) return false;
  if (!isFiniteNumber(value.confidence)) return false;
  return true;
}

function isDimensionConfidenceComponent(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.effectiveEvidence) &&
    isFiniteNumber(value.reliability) &&
    isFiniteNumber(value.consistency) &&
    isFiniteNumber(value.finalConfidence) &&
    typeof value.meetsMinimumSample === 'boolean'
  );
}

function isScoringResult(value: unknown): value is ScoringResult {
  if (!isRecord(value)) return false;
  const cc = value.confidenceComponents;
  if (!isRecord(cc)) return false;
  return ROUTING_WEIGHT_KEYS.every((k) => isDimensionConfidenceComponent(cc[k]));
}

function isEightConstructScaleScore(value: unknown, construct: EightConstructId): value is EightConstructScaleScore {
  if (!isRecord(value)) return false;
  if (value.construct !== construct) return false;
  if (!isFiniteNumber(value.nItems) || value.nItems < 0) return false;
  if (value.mean01 !== null && !isFiniteNumber(value.mean01)) return false;
  if (value.withinPersonItemSd !== null && !isFiniteNumber(value.withinPersonItemSd)) return false;
  if (value.meanSemWithinPerson !== null && !isFiniteNumber(value.meanSemWithinPerson)) return false;
  return true;
}

function isQuestionStemRegion(value: unknown): value is QuestionStemRegion {
  return value === 'global' || value === 'ghana' || value === 'west_africa';
}

function isProfileDimensionStats(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.n) &&
    isFiniteNumber(value.mean01) &&
    isFiniteNumber(value.variance01) &&
    isFiniteNumber(value.contradiction01) &&
    isFiniteNumber(value.confidence01)
  );
}

function isProfileAdaptiveSessionSummary(value: unknown): value is ProfileAdaptiveSessionSummary {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== PROFILE_ADAPTIVE_SESSION_SUMMARY_VERSION) return false;
  if (!isFiniteNumber(value.sessionConfidence)) return false;
  if (!isFiniteNumber(value.meanContradiction01)) return false;
  const bd = value.byDimension;
  if (!isRecord(bd)) return false;
  return ROUTING_WEIGHT_KEYS.every((k) => isProfileDimensionStats(bd[k]));
}

function isStoredAdaptiveMode(value: unknown): value is ResolvedAdaptiveMode {
  return value === 'routing_coverage' || value === 'profile_diagnostic';
}

function isEightConstructOutcome(value: unknown): value is EightConstructOutcome {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== EIGHT_CONSTRUCT_OUTCOME_VERSION) return false;
  if (value.bankId !== 'global_behavioral_v2') return false;
  const scales = value.scales;
  if (!isRecord(scales)) return false;
  for (const id of EIGHT_CONSTRUCT_IDS) {
    if (!isEightConstructScaleScore(scales[id], id)) return false;
  }
  return true;
}

/** Parse persisted pipeline JSON (localStorage / export). Returns null if shape is invalid. */
export function parseStoredPipelineSession(raw: unknown): StoredPipelineSession | null {
  if (!isRecord(raw)) return null;
  if (raw.version !== PIPELINE_STORAGE_VERSION) return null;
  if (typeof raw.completedAt !== 'string') return null;
  if (!isFiniteNumber(raw.responseCount)) return null;
  if (!isPublicProfile(raw.publicProfile)) return null;

  const emb = raw.embedding;
  if (!isRecord(emb)) return null;
  if (!isFiniteNumber(emb.dimension)) return null;
  if (typeof emb.version !== 'string') return null;
  if (!isFiniteNumber(emb.confidence)) return null;
  if (!isNumberArray(emb.vector)) return null;

  const fh = raw.featureHighlights;
  if (!isRecord(fh)) return null;
  if (!isFiniteNumber(fh.overallConfidence)) return null;
  if (!isFiniteNumber(fh.answerConsistency)) return null;
  if (!isFiniteNumber(fh.entropy)) return null;

  if (!isScoringResult(raw.scoringResult)) return null;

  const sessionId = typeof raw.sessionId === 'string' && raw.sessionId.length > 0 ? raw.sessionId : undefined;
  const revision = isFiniteNumber(raw.revision) ? raw.revision : undefined;

  const out: StoredPipelineSession = {
    version: PIPELINE_STORAGE_VERSION,
    sessionId,
    revision,
    completedAt: raw.completedAt,
    responseCount: raw.responseCount,
    publicProfile: raw.publicProfile,
    embedding: {
      dimension: emb.dimension,
      version: emb.version,
      confidence: emb.confidence,
      vector: emb.vector,
    },
    featureHighlights: {
      overallConfidence: fh.overallConfidence,
      answerConsistency: fh.answerConsistency,
      entropy: fh.entropy,
    },
    scoringResult: raw.scoringResult,
  };

  if (raw.eightConstructScores !== undefined && raw.eightConstructScores !== null) {
    if (!isEightConstructOutcome(raw.eightConstructScores)) return null;
    out.eightConstructScores = raw.eightConstructScores;
  }

  if (raw.profileAdaptiveSummary !== undefined && raw.profileAdaptiveSummary !== null) {
    if (isProfileAdaptiveSessionSummary(raw.profileAdaptiveSummary)) {
      out.profileAdaptiveSummary = raw.profileAdaptiveSummary;
    }
  }
  if (raw.stemRegionUsed !== undefined && isQuestionStemRegion(raw.stemRegionUsed)) {
    out.stemRegionUsed = raw.stemRegionUsed;
  }
  if (typeof raw.questionBankId === 'string' && raw.questionBankId.length > 0) {
    out.questionBankId = raw.questionBankId;
  }
  if (typeof raw.bankVersion === 'string' && raw.bankVersion.length > 0) {
    out.bankVersion = raw.bankVersion;
  }
  if (raw.adaptiveMode !== undefined && isStoredAdaptiveMode(raw.adaptiveMode)) {
    out.adaptiveMode = raw.adaptiveMode;
  }
  if (raw.researchMode === true || raw.researchMode === false) {
    out.researchMode = raw.researchMode;
  }

  return out;
}
