'use client';

import { useUiStrings } from '@/lib/use-ui-strings';
import GroupAnalysisClient from './GroupAnalysisClient';

export default function GroupCognitiveAnalysisPage() {
  const strings = useUiStrings();
  return <GroupAnalysisClient strings={strings} />;
}
