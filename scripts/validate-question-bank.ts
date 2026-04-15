/**
 * Validates question banks by loading them the same way as production (schema + research rules + merge).
 */
import { loadQuestionsFromDiskImpl } from '../src/data/question-loader-fs';

async function main(): Promise<void> {
  const errors: string[] = [];

  for (const locale of ['universal', 'ghana', 'en', 'gh-en'] as const) {
    try {
      const merged = await loadQuestionsFromDiskImpl(locale);
      if (merged.length === 0) {
        errors.push(`Locale "${locale}" produced an empty bank`);
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  if (errors.length) {
    console.error('Question bank validation FAILED:\n');
    for (const line of errors) {
      console.error(` - ${line}`);
    }
    process.exit(1);
  }

  console.log('Question bank validation PASSED (universal, ghana, and legacy locale aliases).');
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
