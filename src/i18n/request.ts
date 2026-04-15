import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing } from './routing';
import { deepMergeMessages } from './messages-merge';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const en = (await import('../../messages/en.json')).default as AbstractIntlMessages;
  let messages: AbstractIntlMessages = en;

  if (locale === 'de') {
    const de = (await import('../../messages/de.json')).default as AbstractIntlMessages;
    messages = de;
  } else if (locale === 'tw') {
    const tw = (await import('../../messages/tw.json')).default as AbstractIntlMessages;
    messages = deepMergeMessages(en as Record<string, unknown>, tw as Record<string, unknown>) as AbstractIntlMessages;
  } else if (locale === 'wo') {
    const wo = (await import('../../messages/wo.json')).default as AbstractIntlMessages;
    messages = wo;
  }

  return { locale, messages };
});
