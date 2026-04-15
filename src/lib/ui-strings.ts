import type { AbstractIntlMessages } from 'next-intl';
import en from '../../messages/en.json';
import { flattenMessages } from '@/lib/flatten-messages';

export type UiStrings = Record<string, string>;

export const defaultUiStrings: UiStrings = flattenMessages(en as AbstractIntlMessages);

export function formatUiString(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}
