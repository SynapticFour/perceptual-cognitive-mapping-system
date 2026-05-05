/**
 * Question-bank locale / pack selector (not the same as UI language).
 * - `universal`, `en`, `de`: load `content/questions/universal/*.json` only.
 * - `ghana`, `gh-en`: load universal + `content/questions/ghana/*.json`.
 */
export type SupportedLocale = 'universal' | 'ghana' | 'en' | 'de' | 'gh-en';

/**
 * Maps UI locale (next-intl) to question-bank locale.
 * `tw`/`wo` currently use English item stems until native stem banks are added.
 */
export function questionLocaleFromUiLocale(uiLocale: string): SupportedLocale {
  const l = uiLocale.toLowerCase();
  if (l === 'de') return 'de';
  if (l === 'ghana' || l === 'gh-en') return 'gh-en';
  if (l === 'en' || l === 'universal') return 'en';
  if (l === 'tw' || l === 'wo') return 'en';
  return 'en';
}
