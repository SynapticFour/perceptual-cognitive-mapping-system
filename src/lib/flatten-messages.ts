import type { AbstractIntlMessages } from 'next-intl';

export function flattenMessages(messages: AbstractIntlMessages, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out[path] = value;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flattenMessages(value as AbstractIntlMessages, path));
    }
  }
  return out;
}
