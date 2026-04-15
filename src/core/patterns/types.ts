/** Co-activation pattern mined from many user trait signatures (frequency-based, not spatial). */
export type CognitivePattern = {
  id: string;
  /** Sorted trait ids forming this combination (pairs or triplets). */
  traits: string[];
  /** Number of user signatures in which all listed traits co-occurred. */
  support: number;
  /** support / totalSignatures (0–1); higher = more prevalent in stored history. */
  strength: number;
};

export type PatternMatch = {
  pattern: CognitivePattern;
  /** 0–1 overlap-based similarity to the current user signature. */
  score: number;
};
