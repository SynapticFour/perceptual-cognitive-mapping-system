import type { CognitiveModel } from '@/core/cognitive-pipeline';
import { matchUserToPatterns } from '@/core/patterns/pattern-matching';
import { getDiscoveredPatterns } from '@/core/patterns/pattern-store';
import type { EarlySupportSignal } from '@/cohort/types';
import { extractUserSignature } from '@/core/patterns/user-signature';

/** Normalized spread of weights (0–1 scale, high = uneven field). */
function coefficientOfVariationSq(values: number[]): number {
  const n = values.length;
  if (n <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (mean < 1e-9) return 0;
  const v = values.reduce((s, w) => s + (w - mean) ** 2, 0) / n;
  const cv = Math.sqrt(v) / mean;
  return Math.max(0, Math.min(1, cv / (1 + cv)));
}

/**
 * Non-diagnostic hints for **authorized, individual-facing flows only**.
 * Do not attach to cohort dashboards or public exports.
 */
export function computeEarlySupportSignals(model: CognitiveModel, options?: { maxSignals?: number }): EarlySupportSignal[] {
  const maxSignals = options?.maxSignals ?? 5;
  const out: EarlySupportSignal[] = [];
  const weights = model.activations.map((a) => a.weight).filter((w) => w > 0);
  if (weights.length === 0) return out;

  const sorted = [...weights].sort((a, b) => b - a);
  const ratio = sorted.length >= 2 && sorted[1]! > 1e-9 ? sorted[0]! / sorted[1]! : sorted[0] ?? 0;
  if (ratio > 2.2 && sorted[0]! > 0.18) {
    out.push({
      type: 'activation_peak',
      confidence: Math.min(1, (ratio - 2) / 3),
      suggestion:
        'This profile may benefit from reviewing load balance: one construct is carrying much of the field—gentle pacing changes sometimes help.',
      explanation:
        'Detected a steep peak in the activation field relative to the next strongest activation (shape-based, not a label).',
    });
  }

  const cv2 = coefficientOfVariationSq(weights);
  if (cv2 > 0.45 && weights.length >= 4) {
    out.push({
      type: 'field_imbalance',
      confidence: Math.min(1, cv2),
      suggestion:
        'This profile may benefit from structured transitions and predictable context shifts when energy is unevenly distributed across constructs.',
      explanation:
        'The activation field is unevenly distributed across constructs (statistical spread), which can correlate with fatigue under rapid context change.',
    });
  }

  const sig = extractUserSignature(model.activations);
  const patterns = getDiscoveredPatterns();
  const matches = matchUserToPatterns(sig, patterns, 3);
  const top = matches[0];
  if (top && top.pattern.strength < 0.35 && top.score > 0.45) {
    out.push({
      type: 'rare_pattern_resonance',
      confidence: top.score * (1 - top.pattern.strength),
      suggestion:
        'This profile may benefit from environments that tolerate uncommon trait combinations—explicit flexibility in norms can reduce friction.',
      explanation:
        'Overlap with less frequent co-activation patterns in the anonymized library (descriptive only, not a classification).',
    });
  }

  return out.slice(0, maxSignals);
}
