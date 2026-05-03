import { afterEach, describe, expect, it } from 'vitest';
import { isResearchModeActive, resolveAdaptiveModeResolution } from '@/lib/adaptive-mode-resolution';

describe('resolveAdaptiveModeResolution', () => {
  const origAdaptive = process.env.NEXT_PUBLIC_PCMS_ADAPTIVE_MODE;
  const origResearch = process.env.NEXT_PUBLIC_PCMS_RESEARCH_MODE;

  afterEach(() => {
    if (origAdaptive === undefined) delete process.env.NEXT_PUBLIC_PCMS_ADAPTIVE_MODE;
    else process.env.NEXT_PUBLIC_PCMS_ADAPTIVE_MODE = origAdaptive;
    if (origResearch === undefined) delete process.env.NEXT_PUBLIC_PCMS_RESEARCH_MODE;
    else process.env.NEXT_PUBLIC_PCMS_RESEARCH_MODE = origResearch;
  });

  it('forces profile_diagnostic when research mode env is on', () => {
    process.env.NEXT_PUBLIC_PCMS_RESEARCH_MODE = '1';
    delete process.env.NEXT_PUBLIC_PCMS_ADAPTIVE_MODE;
    const r = resolveAdaptiveModeResolution({});
    expect(r.researchMode).toBe(true);
    expect(r.adaptiveMode).toBe('profile_diagnostic');
  });

  it('respects explicit env routing_coverage', () => {
    process.env.NEXT_PUBLIC_PCMS_RESEARCH_MODE = '0';
    process.env.NEXT_PUBLIC_PCMS_ADAPTIVE_MODE = 'routing_coverage';
    const r = resolveAdaptiveModeResolution({});
    expect(r.adaptiveMode).toBe('routing_coverage');
    expect(r.explicitEnvToken).toBe(true);
  });

  it('constructor override wins when not in research mode', () => {
    process.env.NEXT_PUBLIC_PCMS_RESEARCH_MODE = '0';
    process.env.NEXT_PUBLIC_PCMS_ADAPTIVE_MODE = 'routing_coverage';
    const r = resolveAdaptiveModeResolution({ adaptiveMode: 'profile_diagnostic' });
    expect(r.adaptiveMode).toBe('profile_diagnostic');
  });

  it('isResearchModeActive is true when session persisted researchMode', () => {
    process.env.NEXT_PUBLIC_PCMS_RESEARCH_MODE = '0';
    expect(isResearchModeActive({ researchMode: true })).toBe(true);
    expect(isResearchModeActive({ researchMode: false })).toBe(false);
    expect(isResearchModeActive(null)).toBe(false);
  });
});
