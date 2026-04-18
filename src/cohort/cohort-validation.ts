import type { CohortModel, CohortValidationResult, EnvironmentSignal, FrictionSignal } from '@/cohort/types';

/** Blocked substrings for public cohort copy (case-insensitive). */
export const BANNED_DIAGNOSTIC_TERMS = [
  'autism',
  'adhd',
  'disorder',
  'diagnosis',
  'asperger',
  'neurotypical',
] as const;

function scanText(s: string): string[] {
  const lower = s.toLowerCase();
  const hits: string[] = [];
  for (const t of BANNED_DIAGNOSTIC_TERMS) {
    if (lower.includes(t)) hits.push(t);
  }
  return hits;
}

export function validateCohortPayloadCopy(texts: string[]): CohortValidationResult {
  const bannedTermHits: string[] = [];
  for (const t of texts) {
    bannedTermHits.push(...scanText(t));
  }
  const unique = [...new Set(bannedTermHits)];
  const passesNonDiagnosticLanguage = unique.length === 0;
  return {
    passesNoIndividualExposure: true,
    passesNonDiagnosticLanguage,
    passesAggregateOnly: true,
    bannedTermHits: unique,
    issues: passesNonDiagnosticLanguage ? [] : [`Blocked terms present: ${unique.join(', ')}`],
    interpretabilityNotes: [
      'Each string should explain what the metric measures in plain language (no clinical labels).',
    ],
  };
}

/** Ensure serialized cohort view carries no user ids (heuristic: reject common id key patterns). */
export function assertNoIndividualPayload(payload: unknown): boolean {
  const s = JSON.stringify(payload);
  if (/userId|user_id|sessionId|email|participant_id/i.test(s)) return false;
  return true;
}

export function validateCohortModelView(model: CohortModel): CohortValidationResult {
  const texts = [model.summaryExplanation];
  const base = validateCohortPayloadCopy(texts);
  const ser = JSON.stringify(model);
  const passesNoIndividualExposure = !/userId|user_id|participant|email/i.test(ser);
  return {
    ...base,
    passesNoIndividualExposure: base.passesNoIndividualExposure && passesNoIndividualExposure,
    issues: [
      ...base.issues,
      ...(passesNoIndividualExposure ? [] : ['Possible individual identifier fields in cohort view']),
    ],
  };
}

export function validateEnvironmentSignals(signals: EnvironmentSignal[]): CohortValidationResult {
  const texts = signals.flatMap((s) => [s.narrative, s.explanation, s.id]);
  return validateCohortPayloadCopy(texts);
}

export function validateFrictionSignals(signals: FrictionSignal[]): CohortValidationResult {
  const texts = signals.flatMap((s) => [s.explanation, s.suggestion, ...s.traits]);
  return validateCohortPayloadCopy(texts);
}
