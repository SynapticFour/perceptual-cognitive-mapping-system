'use client';

import { useMessages } from 'next-intl';
import { useMemo } from 'react';
import type { AbstractIntlMessages } from 'next-intl';
import { flattenMessages } from '@/lib/flatten-messages';
import type { UiStrings } from '@/lib/ui-strings';

export function useUiStrings(): UiStrings {
  const messages = useMessages();
  return useMemo(() => flattenMessages(messages as AbstractIntlMessages), [messages]);
}
