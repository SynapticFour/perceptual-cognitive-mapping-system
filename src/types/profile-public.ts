/**
 * Layer 4 — Public interpretation (safe for UI / export; no raw responses).
 */
export interface CognitiveProfilePublic {
  summary: string;
  patterns: string[];
  notes: string[];
  confidence: number;
}
