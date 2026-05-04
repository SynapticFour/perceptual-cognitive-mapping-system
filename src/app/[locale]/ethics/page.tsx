import type { Metadata } from 'next';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'docsPages' });
  return {
    title: t('ethics_meta_title'),
    description: t('ethics_meta_description'),
  };
}

export default async function EthicsDocPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('docsPages');
  const path = join(process.cwd(), 'docs', 'ethics.md');
  const source = await readFile(path, 'utf8');

  return (
    <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-10 pb-20">
      <p className="mb-4 text-sm text-slate-600">
        <Link href="/" className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900">
          {t('back_home')}
        </Link>
      </p>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">{t('ethics_page_title')}</h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-600">{t('ethics_intro')}</p>
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-800">{source}</pre>
      </article>
    </main>
  );
}
