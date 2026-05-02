import { describe, expect, it, afterEach } from 'vitest';
import { buildConsentSteps, shouldIncludeGhanaEthicsStep } from '@/lib/ethics-flow-config';

describe('ethics-flow-config', () => {
  const saved: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const k of Object.keys(saved)) {
      const v = saved[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    Object.keys(saved).forEach((k) => delete saved[k]);
  });

  function set(key: string, value: string | undefined) {
    if (!(key in saved)) saved[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  it('default flow: 2 steps without Ghana when auto and no region', () => {
    set('NEXT_PUBLIC_PCMS_ETHICS_GHANA_STEP', 'auto');
    set('NEXT_PUBLIC_PCMS_ETHICS_REGION', undefined);
    const steps = buildConsentSteps({ mode: 'default', locale: 'en' });
    expect(steps).toEqual(['streamlined_core', 'streamlined_safeguards']);
  });

  it('includes Ghana in default when region is ghana', () => {
    set('NEXT_PUBLIC_PCMS_ETHICS_GHANA_STEP', 'auto');
    set('NEXT_PUBLIC_PCMS_ETHICS_REGION', 'ghana');
    const steps = buildConsentSteps({ mode: 'default', locale: 'en' });
    expect(steps).toEqual(['streamlined_core', 'streamlined_safeguards', 'ghana']);
  });

  it('qa_all_steps expands to six screens when Ghana on', () => {
    set('NEXT_PUBLIC_PCMS_ETHICS_GHANA_STEP', 'on');
    set('NEXT_PUBLIC_PCMS_ETHICS_REGION', undefined);
    const steps = buildConsentSteps({ mode: 'qa_all_steps', locale: 'en' });
    expect(steps).toHaveLength(6);
    expect(steps[steps.length - 1]).toBe('ghana');
  });

  it('shouldIncludeGhanaEthicsStep respects off', () => {
    set('NEXT_PUBLIC_PCMS_ETHICS_GHANA_STEP', 'off');
    set('NEXT_PUBLIC_PCMS_ETHICS_REGION', 'ghana');
    expect(shouldIncludeGhanaEthicsStep('tw')).toBe(false);
  });
});
