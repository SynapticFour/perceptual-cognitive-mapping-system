import type { AtlasDescriptor } from '@/atlas/self-nomination/atlas-descriptors';
import overridesPack from '../../../content/atlas/descriptors-locale-overrides-v1.json';

type OverrideLocales = Record<string, Record<string, string>>;

const LOCALES = (overridesPack as { locales?: OverrideLocales }).locales ?? {};

function overrideKeyForUiLocale(uiLocale: string): keyof typeof LOCALES | null {
  const l = uiLocale.toLowerCase();
  if (l === 'tw' || l === 'ghana' || l === 'gh-en') return 'tw';
  if (l === 'wo') return 'wo';
  return null;
}

/** Card body for self-nomination (English base + optional Tw/Wo overrides). */
export function descriptorDisplayText(descriptor: AtlasDescriptor, uiLocale: string): string {
  const k = overrideKeyForUiLocale(uiLocale);
  if (!k) return descriptor.text;
  const row = LOCALES[k];
  const t = row?.[descriptor.id];
  return typeof t === 'string' && t.trim().length > 0 ? t.trim() : descriptor.text;
}
