import { describe, expect, it } from 'vitest';
import { validateTraitDomainColors, validateTraitSystem } from '@/core/traits/trait-validation';

describe('validateTraitSystem', () => {
  it('passes for the shipped ontology', () => {
    const r = validateTraitSystem();
    expect(r.ok, r.errors.join('; ')).toBe(true);
  });
});

describe('validateTraitDomainColors', () => {
  it('passes for all domains', () => {
    const r = validateTraitDomainColors();
    expect(r.ok, r.errors.join('; ')).toBe(true);
  });
});
