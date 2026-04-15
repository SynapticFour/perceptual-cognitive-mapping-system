import type { TraitDomain } from '@/core/traits/trait-domains';

export type CognitiveActivation = {
  traitId: string;
  domain: TraitDomain;
  vector: number[];
  weight: number;
};
