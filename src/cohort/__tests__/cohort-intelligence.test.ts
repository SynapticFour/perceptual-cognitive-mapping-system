import { describe, expect, it, beforeEach } from 'vitest';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { buildCognitiveModel } from '@/core/cognitive-pipeline';
import { buildCohortCognitiveMap } from '@/cohort/cohort-cognitive-map';
import { deriveEnvironmentSignals } from '@/cohort/environment-signals';
import { FRICTION_SCENARIOS, mapInteractionFriction } from '@/cohort/interaction-friction';
import {
  validateAggregateStructure,
  validateCohortIntelligenceBundle,
  validateCohortModelView,
  validateCohortPayloadCopy,
  validateEnvironmentSignals,
  BANNED_DIAGNOSTIC_TERMS,
} from '@/cohort/cohort-validation';
import { matchCohortToKnownPatterns } from '@/cohort/pattern-cohort-match';
import { minePatterns } from '@/core/patterns/pattern-mining';
import { getPatternLibrary, getTopPatterns, recordUserSignatureWithContext } from '@/cohort';
import { getPatternLibrarySnapshot, resetPatternStoreForTests } from '@/core/patterns/pattern-store';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import { defaultUiStrings } from '@/lib/ui-strings';
import type { ConfidenceComponents } from '@/scoring';

const mockDisplay: DimensionDisplayModel = {
  rawPercent: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 50])) as DimensionDisplayModel['rawPercent'],
  weightedPercent: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 50])) as DimensionDisplayModel['weightedPercent'],
  itemsContributing: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 0])) as DimensionDisplayModel['itemsContributing'],
};

const mockConfidence: ConfidenceComponents = Object.fromEntries(
  ROUTING_WEIGHT_KEYS.map((d) => [
    d,
    {
      effectiveEvidence: 1,
      reliability: 1,
      consistency: 1,
      finalConfidence: 0.8,
      meetsMinimumSample: true,
    },
  ])
) as ConfidenceComponents;

function makeModel(seed: number) {
  return buildCognitiveModel({
    embeddingVector: new Array(32).fill(0).map((_, i) => (((i + seed) % 10) + Math.sin(seed)) / 12),
    embeddingDimension: 32,
    display: mockDisplay,
    confidenceComponents: mockConfidence,
    strings: defaultUiStrings,
    syntheticCount: 64,
  });
}

describe('buildCohortCognitiveMap', () => {
  it('pools activations from multiple models', () => {
    const m = buildCohortCognitiveMap([makeModel(1), makeModel(2)]);
    expect(m.cohortPoints.length).toBeGreaterThan(3);
    expect(m.dominantTraits.length).toBeGreaterThan(0);
    expect(m.summaryExplanation.length).toBeGreaterThan(10);
    const v = validateCohortModelView(m);
    expect(v.passesNonDiagnosticLanguage).toBe(true);
  });

  it('computes friction when regions separate', () => {
    const cm = buildCohortCognitiveMap([makeModel(3), makeModel(4), makeModel(5)]);
    const friction = mapInteractionFriction(cm);
    expect(Array.isArray(friction)).toBe(true);
  });
});

describe('environment + validation', () => {
  it('derives environment signals without banned terms', () => {
    const cm = buildCohortCognitiveMap([makeModel(6)]);
    const env = deriveEnvironmentSignals(cm);
    const v = validateEnvironmentSignals(env);
    expect(v.passesNonDiagnosticLanguage).toBe(true);
    expect(env.length).toBe(8);
  });

  it('exports friction scenarios for each default pair', () => {
    expect(FRICTION_SCENARIOS.length).toBeGreaterThanOrEqual(3);
    for (const s of FRICTION_SCENARIOS) {
      expect(s.pair.length).toBe(2);
      expect(s.explanation.length).toBeGreaterThan(20);
      expect(s.suggestion.length).toBeGreaterThan(20);
    }
  });

  it('rejects banned diagnostic language', () => {
    const r = validateCohortPayloadCopy(['this may relate to autism traits']);
    expect(r.passesNonDiagnosticLanguage).toBe(false);
  });

  it('documents banned terms', () => {
    expect(BANNED_DIAGNOSTIC_TERMS.length).toBeGreaterThan(3);
  });

  it('validateAggregateStructure passes for built cohort maps', () => {
    const cm = buildCohortCognitiveMap([makeModel(8), makeModel(9)]);
    const s = validateAggregateStructure(cm);
    expect(s.passesDistributionCheck).toBe(true);
    expect(s.issues).toHaveLength(0);
  });

  it('validateCohortIntelligenceBundle combines checks', () => {
    const cm = buildCohortCognitiveMap([makeModel(10)]);
    const env = deriveEnvironmentSignals(cm);
    const friction = mapInteractionFriction(cm);
    const bundle = validateCohortIntelligenceBundle(cm, env, friction);
    expect(bundle.passesNonDiagnosticLanguage).toBe(true);
    expect(bundle.passesAggregateOnly).toBe(true);
  });
});

describe('pattern library + cohort match', () => {
  beforeEach(() => {
    resetPatternStoreForTests();
  });

  it('getPatternLibrary matches getPatternLibrarySnapshot', () => {
    expect(getPatternLibrary()).toEqual(getPatternLibrarySnapshot());
  });

  it('matches cohort emphasis to mined patterns', () => {
    recordUserSignatureWithContext(['novelty_seeking', 'routine_affinity', 'sustained_focus'], 'lab-cohort');
    recordUserSignatureWithContext(['novelty_seeking', 'routine_affinity', 'sustained_focus'], 'lab-cohort');
    const patterns = getTopPatterns(20);
    expect(patterns.length).toBeGreaterThan(0);
    const cm = buildCohortCognitiveMap([makeModel(7)]);
    const mined = minePatterns([
      ['novelty_seeking', 'routine_affinity'],
      ['novelty_seeking', 'routine_affinity', 'sustained_focus'],
    ]);
    const matches = matchCohortToKnownPatterns(cm, mined, 5);
    expect(Array.isArray(matches)).toBe(true);
  });
});
