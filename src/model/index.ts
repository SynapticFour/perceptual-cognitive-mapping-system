export { LatentRepresentationManager, StatisticalFeatureExtractor } from './latent-representation';
export type { CognitiveFeatures, LatentCognitiveVector } from './latent-representation';

export {
  COGNITIVE_DIMENSION_KEYS,
  COGNITIVE_DIMENSION_METADATA,
  DEFAULT_COGNITIVE_VECTOR,
  DEFAULT_CONFIDENCE,
  emptyTagCoverage,
} from './cognitive-dimensions';
export type { CognitiveDimension, CognitiveVector, TagCoverageVector } from './cognitive-dimensions';

/** Public alias for routing dimensions (opaque tags, not a clinical typology). */
export { COGNITIVE_DIMENSION_KEYS as COGNITIVE_DIMENSIONS } from './cognitive-dimensions';
