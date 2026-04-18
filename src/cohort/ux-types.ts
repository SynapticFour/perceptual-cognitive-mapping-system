/** Guidance-oriented UX layer — non-diagnostic, aggregate-safe where noted. */

export type InsightConfidenceBand = 'low' | 'medium' | 'high';

export type GuidanceInsight = {
  id: string;
  title: string;
  explanation: string;
  confidence: InsightConfidenceBand;
  /** High-level only — for “Why am I seeing this?” */
  whyContributors: string[];
};

export type GuidanceRecommendation = {
  title: string;
  description: string;
  rationale: string;
  confidence: InsightConfidenceBand;
};

export type InteractionDynamicsItem = {
  headline: string;
  expanded: string;
  confidence: InsightConfidenceBand;
};

export const MAX_GUIDANCE_INSIGHTS = 5 as const;
export const MAX_EARLY_SUPPORT_SIGNALS_UI = 4 as const;
