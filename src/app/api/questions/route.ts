import { NextResponse } from 'next/server';

import { loadQuestionsFromDiskImpl } from '@/data/question-loader-fs';
import type { SupportedLocale } from '@/data/question-locale-types';

const VALID_TYPES = new Set(['core', 'refinement', 'all']);

function isSupportedLocale(value: string): value is SupportedLocale {
  return value === 'universal' || value === 'ghana' || value === 'en' || value === 'de' || value === 'gh-en';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get('locale') ?? 'universal';
  const typeParam = searchParams.get('type') ?? 'all';

  if (!isSupportedLocale(localeParam)) {
    return NextResponse.json(
      { error: 'Invalid locale. Use universal, ghana, en, de, or gh-en.' },
      { status: 400 }
    );
  }

  if (!VALID_TYPES.has(typeParam)) {
    return NextResponse.json({ error: 'Invalid type. Use core, refinement, or all.' }, { status: 400 });
  }

  try {
    const all = await loadQuestionsFromDiskImpl(localeParam);
    const filtered =
      typeParam === 'all' ? all : all.filter((q) => q.type === typeParam);

    return NextResponse.json(filtered, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load questions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
