'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { StoredPipelineSession } from '@/types/pipeline-session';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { ATLAS_DESCRIPTORS, type AtlasDescriptor } from '@/atlas/self-nomination/atlas-descriptors';

export interface SelfNominationResearchNoteProps {
  session: StoredPipelineSession;
  selectedDescriptorIds: string[];
  explicitNone: boolean;
  skipped: boolean;
}

function descriptorById(id: string): AtlasDescriptor | undefined {
  return ATLAS_DESCRIPTORS.find((d) => d.id === id);
}

export default function SelfNominationResearchNote({
  session,
  selectedDescriptorIds,
  explicitNone,
  skipped,
}: SelfNominationResearchNoteProps) {
  const t = useTranslations('selfNomination');

  const traits = useMemo(() => {
    const out: string[] = [];
    for (const id of selectedDescriptorIds) {
      const d = descriptorById(id);
      if (d?.metaTrait) out.push(d.metaTrait);
    }
    return [...new Set(out)];
  }, [selectedDescriptorIds]);

  const scoreLine = useMemo(() => {
    const cc = session.scoringResult.confidenceComponents;
    return ROUTING_WEIGHT_KEYS.map((k) => `${k}:${(cc[k]?.finalConfidence ?? 0).toFixed(2)}`).join(' · ');
  }, [session.scoringResult.confidenceComponents]);

  const count = selectedDescriptorIds.length;

  return (
    <aside
      className="mt-6 rounded-lg border border-amber-300/80 bg-amber-50/90 px-4 py-3 text-left text-xs text-amber-950 shadow-sm"
      aria-label={t('research_aria')}
    >
      <p className="font-semibold text-amber-950">{t('research_heading')}</p>
      {skipped ? (
        <p className="mt-1 leading-relaxed">{t('research_skipped')}</p>
      ) : explicitNone && count === 0 ? (
        <p className="mt-1 leading-relaxed">{t('research_explicit_none')}</p>
      ) : (
        <p className="mt-1 leading-relaxed">
          {t('research_count', { count })}
          {traits.length > 0 ? (
            <>
              {' '}
              {t('research_traits_prefix')}{' '}
              <span className="font-mono text-[11px]">{traits.join(', ')}</span>
            </>
          ) : null}
        </p>
      )}
      {!skipped ? (
        <p className="mt-2 font-mono text-[11px] leading-snug text-amber-900/90">{scoreLine}</p>
      ) : null}
      <p className="mt-2 text-[11px] leading-relaxed text-amber-900/85">{t('research_disclaimer')}</p>
    </aside>
  );
}
