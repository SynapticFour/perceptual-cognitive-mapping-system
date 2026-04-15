/**
 * Captures how the participant frames the assessment before viewing results
 * (cultural framing, intended use, explicit non-diagnostic assent).
 */
export interface AssessmentContext {
  culturalContext: 'western' | 'ghana' | 'universal';
  intendedUse: 'self-understanding' | 'research' | 'education' | 'other';
  userAcknowledgedNonDiagnostic: boolean;
  userAcknowledgedResearchOnly: boolean;
}

export const PCMS_ASSESSMENT_CONTEXT_KEY = 'pcms-assessment-context';

export function isAssessmentContext(x: unknown): x is AssessmentContext {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  const cc = o.culturalContext;
  const iu = o.intendedUse;
  return (
    (cc === 'western' || cc === 'ghana' || cc === 'universal') &&
    (iu === 'self-understanding' || iu === 'research' || iu === 'education' || iu === 'other') &&
    o.userAcknowledgedNonDiagnostic === true &&
    o.userAcknowledgedResearchOnly === true
  );
}

export function parseAssessmentContext(raw: string | null): AssessmentContext | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    return isAssessmentContext(v) ? v : null;
  } catch {
    return null;
  }
}

export function readAssessmentContextFromStorage(): AssessmentContext | null {
  if (typeof window === 'undefined') return null;
  try {
    return parseAssessmentContext(localStorage.getItem(PCMS_ASSESSMENT_CONTEXT_KEY));
  } catch {
    return null;
  }
}
