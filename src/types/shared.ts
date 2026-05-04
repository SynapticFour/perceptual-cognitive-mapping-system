/**
 * Types shared by PCMS and ATLAS pipelines. Do not import scoring logic here.
 * @see docs/DECISIONS.md (ADR-001, ADR-002)
 */

/** A locale-keyed identifier — used by both PCMS and ATLAS */
export type LocaleKey = 'en' | 'de' | 'tw' | 'wo' | string;

/** An anonymous participant ID — same scheme for both instruments */
export type AnonymousParticipantId = string; // UUID v4

/** A question bank identifier */
export type QuestionBankId = string; // e.g. "pcms-global-v2", "atlas-v1"

/** A dimension or micro-trait key */
export type DimensionKey = string; // PCMS: "F"|"P"|...|"V", ATLAS: "MT-intero"|...

/** A score entry — used by both scoring pipelines */
export interface DimensionScore {
  key: DimensionKey;
  score: number; // 0–1 normalised
  confidence: number; // 0–1
  nItems: number; // how many items contributed
  instrument: 'pcms' | 'atlas' | 'self-nomination';
}

/** A covariance prior entry (ATLAS imputation) */
export interface CovariancePrior {
  instrument: 'atlas';
  locale: LocaleKey;
  version: string;
  traits: DimensionKey[];
  matrix: number[][]; // n×n covariance matrix, same order as traits[]
  sampleSize: number; // N used to estimate this matrix
  computedAt: string; // ISO date
}
