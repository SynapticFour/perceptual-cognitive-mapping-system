'use client';

import { useUiStrings } from '@/lib/use-ui-strings';
import FieldImportClient from './FieldImportClient';

export default function FieldImportPage() {
  const strings = useUiStrings();
  return <FieldImportClient strings={strings} />;
}
