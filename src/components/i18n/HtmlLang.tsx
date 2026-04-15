'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';

/** Sets <html lang> because the root layout cannot read `[locale]` directly. */
export default function HtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
