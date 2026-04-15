import { ROUTING_WEIGHT_KEYS, type RoutingWeightKey } from '@/adaptive/routing-tags';
import type { ConfidenceComponents } from '@/scoring';

const DEFAULT_THRESHOLD = 0.75;

/** Dimensions whose routing confidence is still below the research display threshold. */
export function dimensionsBelowConfidenceThreshold(
  confidenceComponents: ConfidenceComponents,
  threshold: number = DEFAULT_THRESHOLD
): RoutingWeightKey[] {
  return ROUTING_WEIGHT_KEYS.filter((d) => confidenceComponents[d].finalConfidence < threshold);
}
