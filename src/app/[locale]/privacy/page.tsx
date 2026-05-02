import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'privacyPage' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('privacyPage');

  return (
    <main className="mx-auto min-h-[60vh] max-w-2xl px-4 py-10 pb-16">
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">{t('page_title')}</h1>
        <p className="mb-10 text-sm leading-relaxed text-slate-700">{t('intro')}</p>

        <Section title={t('controller_heading')}>
          <p>{t('controller_body')}</p>
        </Section>

        <Section title={t('data_heading')}>
          <p>{t('data_body')}</p>
        </Section>

        <Section title={t('legal_basis_heading')}>
          <p>{t('legal_basis_body')}</p>
        </Section>

        <Section title={t('hosting_heading')}>
          <p>{t('hosting_body')}</p>
        </Section>

        <Section title={t('transfers_heading')}>
          <p>{t('transfers_body')}</p>
        </Section>

        <Section title={t('storage_heading')}>
          <p>{t('storage_body_supabase')}</p>
          <p>{t('storage_body_local')}</p>
          <p className="text-xs text-slate-500">{t('storage_verification_note')}</p>
        </Section>

        <Section title={t('local_storage_heading')}>
          <p>{t('local_storage_body')}</p>
        </Section>

        <Section title={t('retention_heading')}>
          <p>{t('retention_body')}</p>
        </Section>

        <Section title={t('deletion_heading')}>
          <p>
            {t('deletion_before_link')}{' '}
            <Link href="/results" className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900">
              {t('deletion_link')}
            </Link>
            {t('deletion_after_link')}
          </p>
        </Section>

        <Section title={t('withdrawal_heading')}>
          <p>{t('withdrawal_body')}</p>
        </Section>

        <Section title={t('sharing_heading')}>
          <p>{t('sharing_body')}</p>
        </Section>

        <Section title={t('rights_heading')}>
          <p>{t('rights_body')}</p>
        </Section>

        <Section title={t('automated_heading')}>
          <p>{t('automated_body')}</p>
        </Section>

        <Section title={t('disclaimer_heading')}>
          <p>{t('disclaimer_body')}</p>
        </Section>

        <Section title={t('supervisory_heading')}>
          <p>{t('supervisory_body')}</p>
        </Section>

        <Section title={t('contact_heading')}>
          <p>{t('contact_body')}</p>
        </Section>

        <p className="mt-10 border-t border-slate-100 pt-6 text-xs text-slate-500">{t('not_legal_advice')}</p>
        <p className="mt-2 text-xs text-slate-500">{t('last_updated')}</p>
      </article>
    </main>
  );
}
