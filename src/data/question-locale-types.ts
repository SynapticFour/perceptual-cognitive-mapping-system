/**
 * Question-bank locale / pack selector (not the same as UI language).
 * - `universal`, `en`, `de`: load `content/questions/universal/*.json` only.
 * - `ghana`, `gh-en`: load universal + `content/questions/ghana/*.json`.
 */
export type SupportedLocale = 'universal' | 'ghana' | 'en' | 'de' | 'gh-en';
