/**
 * Adaptive questionnaire routing tags — opaque keys aligned with {@link COGNITIVE_DIMENSION_KEYS}.
 * Re-exported names preserve existing imports across the codebase.
 */

export {
  COGNITIVE_DIMENSION_KEYS as ROUTING_WEIGHT_KEYS,
  type CognitiveDimension as RoutingWeightKey,
  type TagCoverageVector,
  emptyTagCoverage,
} from '@/model/cognitive-dimensions';
