/**
 * Ten-dimensional routing model for adaptive selection and results display.
 * F–C are the original routing axes; T, I, A, V extend the space with additional
 * psychologically motivated constructs (non-diagnostic; research-facing notes in metadata).
 */

export const COGNITIVE_DIMENSION_KEYS = ['F', 'P', 'S', 'E', 'R', 'C', 'T', 'I', 'A', 'V'] as const;

export type CognitiveDimension = (typeof COGNITIVE_DIMENSION_KEYS)[number];

/**
 * Primary results presentation (ADR-007): Focus–Flexibility / core routing axes shown first.
 * Temporal, interoceptive, associative, verbal-spatial appear in a default-collapsed disclosure until reversal criteria are met.
 */
export const PRIMARY_RESULTS_ROUTING_KEYS = ['F', 'P', 'S', 'E', 'R', 'C'] as const satisfies readonly CognitiveDimension[];

export type PrimaryResultsRoutingKey = (typeof PRIMARY_RESULTS_ROUTING_KEYS)[number];

/** Research-facing routing dimensions (T–V) per ADR-007. */
export const RESEARCH_ROUTING_KEYS = ['T', 'I', 'A', 'V'] as const satisfies readonly CognitiveDimension[];

export type ResearchRoutingKey = (typeof RESEARCH_ROUTING_KEYS)[number];

/** Unit-interval scores or confidences keyed by routing dimension. */
export type CognitiveVector = Record<CognitiveDimension, number>;

/** Neutral 0.5 posterior on each axis when no evidence is available. */
export const DEFAULT_COGNITIVE_VECTOR: CognitiveVector = {
  F: 0.5,
  P: 0.5,
  S: 0.5,
  E: 0.5,
  R: 0.5,
  C: 0.5,
  T: 0.5,
  I: 0.5,
  A: 0.5,
  V: 0.5,
};

/** Per-dimension confidence before any weighted evidence is accumulated. */
export const DEFAULT_CONFIDENCE: CognitiveVector = {
  F: 0,
  P: 0,
  S: 0,
  E: 0,
  R: 0,
  C: 0,
  T: 0,
  I: 0,
  A: 0,
  V: 0,
};

/** Same numeric domain as {@link CognitiveVector}; used by adaptive coverage helpers. */
export type TagCoverageVector = CognitiveVector;

export function emptyTagCoverage(): TagCoverageVector {
  return { ...DEFAULT_CONFIDENCE };
}

export interface CognitiveDimensionMeta {
  key: CognitiveDimension;
  /** Author-facing construct description (not shown verbatim in UI). */
  description: string;
  lowLabel: string;
  highLabel: string;
  /** Literature anchors — correlational / theoretical, not diagnostic claims. */
  researchNotes: string;
}

/**
 * Canonical copy for tooling, exports, and i18n seeding.
 * UI strings in `messages/en.json` should stay aligned with titles/labels where applicable.
 */
export const COGNITIVE_DIMENSION_METADATA: Record<CognitiveDimension, CognitiveDimensionMeta> = {
  F: {
    key: 'F',
    description: 'Sustained attention and resistance to distraction.',
    lowLabel: 'Easily distracted',
    highLabel: 'Deep focus capability',
    researchNotes: 'Attention networks, sustained-performance paradigms.',
  },
  P: {
    key: 'P',
    description: 'Preference for abstract structure versus concrete sequencing.',
    lowLabel: 'Concrete, step-by-step thinking',
    highLabel: 'Abstract pattern spotting',
    researchNotes: 'Relational processing, matrix reasoning literature.',
  },
  S: {
    key: 'S',
    description: 'Reactivity to sensory load (auditory, visual, tactile).',
    lowLabel: 'Low sensory reactivity',
    highLabel: 'High sensory sensitivity',
    researchNotes: 'Sensory processing sensitivity; occupational therapy constructs.',
  },
  E: {
    key: 'E',
    description: 'Energy cost or gain from sustained social contact.',
    lowLabel: 'Energised by groups',
    highLabel: 'Drained by prolonged social contact',
    researchNotes: 'Social motivation / introversion–extraversion energy models.',
  },
  R: {
    key: 'R',
    description: 'Preference for predictable structure and advance planning.',
    lowLabel: 'Flexible, improvising style',
    highLabel: 'Strong preference for routine and plans',
    researchNotes: 'Cognitive need for closure; intolerance of uncertainty (related).',
  },
  C: {
    key: 'C',
    description: 'Comfort revising mental models when information changes.',
    lowLabel: 'Prefers clear, stable answers',
    highLabel: 'Comfortable with ambiguity and change',
    researchNotes: 'Cognitive flexibility / set-shifting tasks.',
  },
  /**
   * T — Temporal processing
   * How precisely and consistently someone perceives, plans for, and experiences time.
   * Research anchors: time reproduction/discrimination tasks; ADHD time estimation;
   * autism time perception; chronobiology / circadian preference interactions.
   */
  T: {
    key: 'T',
    description:
      'How precisely and consistently time is perceived, planned for, and experienced moment-to-moment.',
    lowLabel: 'Time-forgetting / in-the-moment',
    highLabel: 'Highly precise time sense',
    researchNotes:
      'ADHD time estimation & time reproduction; autism temporal processing; chronobiology / circadian timing.',
  },
  /**
   * I — Interoceptive awareness
   * Conscious access to internal bodily signals (hunger, fatigue, heartbeat, emotion-as-sensation).
   * Research anchors: interoceptive accuracy/sensibility; alexithymia; autism interoception;
   * trauma-related dissociation; eating disorders.
   */
  I: {
    key: 'I',
    description:
      'Awareness of internal bodily signals (hunger, fatigue, heartbeat, emotions as physical sensation).',
    lowLabel: 'Low body awareness',
    highLabel: 'High body awareness',
    researchNotes:
      'Interoception literature; alexithymia; autism interoceptive differences; trauma/dissociation; eating disorders.',
  },
  /**
   * A — Associative / divergent thinking
   * Tendency toward unusual, far-reaching cross-connections between concepts.
   * Research anchors: divergent thinking / creativity; manic thought tempo;
   * schizotypy / unusual associations; giftedness hyperconnectivity hypotheses; ADHD idea generation.
   */
  A: {
    key: 'A',
    description: 'Tendency toward unusual, far-reaching associations between concepts.',
    lowLabel: 'Linear / convergent',
    highLabel: 'Strongly associative / divergent',
    researchNotes:
      'Creativity & divergent thinking; mania / mood disorders; schizotypy; giftedness; ADHD idea density.',
  },
  /**
   * V — Verbal–visual processing bias
   * Dominant cognitive processing style: language-sequential versus imagery-spatial holistic.
   * Research anchors: cognitive style / dual coding; dyslexia verbal weaknesses;
   * autism visual–local processing biases; twice-exceptional profiles.
   */
  V: {
    key: 'V',
    description: 'Dominant processing mode — verbal-sequential versus visuo-spatial holistic.',
    lowLabel: 'Verbal / sequential',
    highLabel: 'Visuo-spatial / holistic',
    researchNotes:
      'Verbaliser–visualiser cognitive styles; dyslexia; autism visual processing; gifted spatial profiles.',
  },
};
