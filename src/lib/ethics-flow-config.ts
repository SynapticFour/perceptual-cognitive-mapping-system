/**
 * Build-time / runtime consent flow (NEXT_PUBLIC_* is inlined by Next.js on the client).
 *
 * - default: fewer screens (bundled copy), optional Ghana step by region/locale.
 * - qa_all_steps: every separate section (for QA / screenshots).
 * - skip: for automated tests / dev — auto-seed consent (never use in production studies).
 */

export type ConsentRuntimeMode = 'default' | 'skip' | 'qa_all_steps';

export type GhanaStepPolicy = 'auto' | 'on' | 'off';

export type ConsentStepId =
  | 'research'
  | 'measured'
  | 'limits'
  | 'privacy'
  | 'rights'
  | 'ghana'
  | 'streamlined_core'
  | 'streamlined_safeguards';

function readPublicEnv(name: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined;
  return process.env[name];
}

export function getConsentRuntimeMode(): ConsentRuntimeMode {
  const raw = readPublicEnv('NEXT_PUBLIC_PCMS_CONSENT_MODE')?.trim().toLowerCase();
  if (raw === 'skip' || raw === 'qa_all_steps') return raw;
  return 'default';
}

/** Whether the optional Ghana / medical-context ethics screen appears in the ladder. */
export function getGhanaStepPolicy(): GhanaStepPolicy {
  const raw = readPublicEnv('NEXT_PUBLIC_PCMS_ETHICS_GHANA_STEP')?.trim().toLowerCase();
  if (raw === 'on' || raw === 'off') return raw;
  return 'auto';
}

/**
 * `auto`: on for Twi (`tw`) or explicit `NEXT_PUBLIC_PCMS_ETHICS_REGION=ghana|west_africa`; otherwise off
 * (e.g. Norway/EU deploys without an extra regional screen).
 */
export function shouldIncludeGhanaEthicsStep(locale: string): boolean {
  const policy = getGhanaStepPolicy();
  if (policy === 'on') return true;
  if (policy === 'off') return false;
  const region = readPublicEnv('NEXT_PUBLIC_PCMS_ETHICS_REGION')?.trim().toLowerCase();
  if (region === 'ghana' || region === 'west_africa') return true;
  return locale === 'tw';
}

export function buildConsentSteps(options: { mode: ConsentRuntimeMode; locale: string }): ConsentStepId[] {
  const { mode, locale } = options;
  const ghana = shouldIncludeGhanaEthicsStep(locale);

  if (mode === 'qa_all_steps') {
    const full: ConsentStepId[] = ['research', 'measured', 'limits', 'privacy', 'rights'];
    if (ghana) full.push('ghana');
    return full;
  }

  const streamlined: ConsentStepId[] = ['streamlined_core', 'streamlined_safeguards'];
  if (ghana) streamlined.push('ghana');
  return streamlined;
}

export function writePcmsConsentLocalStorage(
  stepsConfirmed: readonly string[],
  extra?: { consentMode?: string }
): void {
  if (typeof window === 'undefined') return;
  const ts = new Date().toISOString();
  localStorage.setItem('pcms-consent-timestamp', ts);
  localStorage.setItem(
    'pcms-consent-details',
    JSON.stringify({
      version: '2.0',
      timestamp: ts,
      stepsConfirmed: [...stepsConfirmed],
      ageConfirmation: true,
      voluntaryParticipation: true,
      dataUseAgreement: true,
      ...extra,
    })
  );
}

/** Seeds consent when `NEXT_PUBLIC_PCMS_CONSENT_MODE=skip` and no record exists. */
export function seedConsentIfSkipMode(locale: string): boolean {
  if (typeof window === 'undefined') return false;
  if (getConsentRuntimeMode() !== 'skip') return false;
  if (localStorage.getItem('pcms-consent-timestamp')) return false;
  const steps = buildConsentSteps({ mode: 'default', locale });
  writePcmsConsentLocalStorage(steps, { consentMode: 'skip' });
  return true;
}
