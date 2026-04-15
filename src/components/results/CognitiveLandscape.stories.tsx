// Storybook stories for CognitiveLandscape component
// Note: These will work once Storybook dependencies are installed

import type { CognitiveProfilePublic } from '@/types/profile-public';

const mockProfile: CognitiveProfilePublic = {
  summary: 'Strong focus preferences with structured approaches',
  patterns: [
    'You show strong focus preferences with structured approaches',
    'Pattern processing is moderate with good adaptability',
    'Social interactions energize you more than solitary work',
  ],
  notes: [
    'Highly unstructured environments may be challenging',
    'Rapid context switching can be difficult',
    'Extended social isolation may affect performance',
  ],
  confidence: 0.82,
};

// Storybook story templates (will work with Storybook setup)
export const stories = {
  Default: {
    profile: mockProfile,
    viewMode: 'map',
    showLabels: true,
    interactive: true,
  },
  DensityView: {
    profile: mockProfile,
    viewMode: 'density',
    showLabels: false,
    interactive: true,
  },
  VectorView: {
    profile: mockProfile,
    viewMode: 'vector',
    showLabels: true,
    interactive: true,
  },
  LowConfidence: {
    profile: {
      ...mockProfile,
      confidence: 0.45,
      patterns: ['Limited data available for reliable interpretation'],
    },
    viewMode: 'map',
    showLabels: true,
    interactive: true,
  },
};
