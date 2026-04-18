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

/**
 * Distribution / shape check: cohort outputs should reflect pooled activations only
 * (aligned point/weight arrays; regional trait mass normalized where present).
 */
export function validateAggregateStructure(model: CohortModel): {
  passesDistributionCheck: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  if (model.cohortPoints.length !== model.cohortWeights.length) {
    issues.push('cohortPoints and cohortWeights must have the same length (one weight per pooled activation).');
  }
  for (const r of model.regions) {
    const vals = Object.values(r.traitDistribution);
    if (vals.length === 0) continue;
    const sum = vals.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 0.08) {
      issues.push(`Region ${r.id}: trait mass should be approximately normalized (sum ${sum.toFixed(3)}).`);
    }
  }
  return { passesDistributionCheck: issues.length === 0, issues };
}

/**
 * Run structure + language checks on a cohort model and optional derived signals.
 * Use before publishing aggregate payloads or rendering public cohort views.
 */
export function validateCohortIntelligenceBundle(
  model: CohortModel,
  environmentSignals?: EnvironmentSignal[],
  frictionSignals?: FrictionSignal[]
): CohortValidationResult {
  const structural = validateAggregateStructure(model);
  const modelView = validateCohortModelView(model);
  const envResult = environmentSignals?.length ? validateEnvironmentSignals(environmentSignals) : null;
  const frResult = frictionSignals?.length ? validateFrictionSignals(frictionSignals) : null;

  const bannedTermHits = [
    ...new Set([
      ...modelView.bannedTermHits,
      ...(envResult?.bannedTermHits ?? []),
      ...(frResult?.bannedTermHits ?? []),
    ]),
  ];

  const issues = [
    ...modelView.issues,
    ...(structural.passesDistributionCheck ? [] : structural.issues),
    ...(envResult?.issues ?? []),
    ...(frResult?.issues ?? []),
  ];
  const uniqueIssues = [...new Set(issues)];

  return {
    passesNoIndividualExposure:
      modelView.passesNoIndividualExposure &&
      (envResult?.passesNoIndividualExposure ?? true) &&
      (frResult?.passesNoIndividualExposure ?? true),
    passesNonDiagnosticLanguage:
      modelView.passesNonDiagnosticLanguage &&
      (envResult?.passesNonDiagnosticLanguage ?? true) &&
      (frResult?.passesNonDiagnosticLanguage ?? true),
    /** True when pooled structure is valid and optional signal copy passes checks. */
    passesAggregateOnly:
      structural.passesDistributionCheck &&
      modelView.passesAggregateOnly &&
      (envResult?.passesAggregateOnly ?? true) &&
      (frResult?.passesAggregateOnly ?? true),
    bannedTermHits,
    issues: uniqueIssues,
    interpretabilityNotes: [
      ...modelView.interpretabilityNotes,
      ...(structural.passesDistributionCheck ? [] : ['Verify cohort build used pooled activations only.']),
    ],
  };
}
