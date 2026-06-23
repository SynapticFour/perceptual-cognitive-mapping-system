import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'de', 'fr', 'sw', 'tw', 'wo'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export type AppLocale = (typeof routing.locales)[number];
