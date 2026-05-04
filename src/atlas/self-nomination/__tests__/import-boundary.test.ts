import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');

const FORBIDDEN = [
  '@/scoring',
  '@/lib/cognitive-pipeline',
  '@/core/cognitive-pipeline',
  '@/adaptive/questionnaire-engine',
] as const;

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === '__tests__') continue;
      walkTsFiles(p, out);
    } else if (name.isFile() && (name.name.endsWith('.ts') || name.name.endsWith('.tsx'))) {
      out.push(p);
    }
  }
  return out;
}

describe('ATLAS self-nomination import boundary (ADR-003)', () => {
  it('does not import scoring or pipeline modules', () => {
    const files = walkTsFiles(ROOT);
    expect(files.length).toBeGreaterThan(0);

    const importLine = /(?:from\s+['"]|import\s*\(\s*['"])(@[^'"]+)(['"])/g;

    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      let m: RegExpExecArray | null;
      importLine.lastIndex = 0;
      while ((m = importLine.exec(src)) !== null) {
        const spec = m[1] ?? '';
        for (const prefix of FORBIDDEN) {
          expect(
            spec === prefix || spec.startsWith(`${prefix}/`),
            `${file}: forbidden import "${spec}" (${prefix})`
          ).toBe(false);
        }
      }
    }
  });
});
