'use client';

import { useEffect, useMemo } from 'react';
import type { CognitiveModel } from '@/core/cognitive-pipeline';
import { formatTraitLabel } from '@/core/traits/trait-mapping';
import { TRAIT_DOMAIN_HEX, formatTraitDomainLabel, type TraitDomain } from '@/core/traits/trait-domains';
import type { UiStrings } from '@/lib/ui-strings';

export interface VectorViewProps {
  model: CognitiveModel;
  strings: UiStrings;
  /** Max embedding dimensions to show in the blended (technical) section. */
  topN?: number;
}

export default function VectorView({ model, strings, topN = 14 }: VectorViewProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    console.log(
      '[PCMS constellation] VectorView: rendering',
      model.activations.length,
      'activation row(s) (expected many, not 1)'
    );
  }, [model.fingerprint, model.activations.length]);

  const activationRows = useMemo(() => {
    const rows = model.activations.map((act, i) => ({
      traitId: act.traitId,
      domain: act.domain,
      displayWeight: model.pointWeights[i] ?? act.weight,
      activationIndex: i,
    }));
    rows.sort((a, b) => {
      const d = a.domain.localeCompare(b.domain);
      if (d !== 0) return d;
      return a.traitId.localeCompare(b.traitId);
    });
    return rows;
  }, [model]);

  const regionsOrdered = useMemo(() => {
    if (model.cognitiveRegions.length < 2) return [];
    return [...model.cognitiveRegions].sort((a, b) => {
      const d = a.centroid.x - b.centroid.x;
      if (Math.abs(d) > 1e-6) return d;
      return a.id.localeCompare(b.id);
    });
  }, [model.cognitiveRegions]);

  const activationByDomain = useMemo(() => {
    const m = new Map<TraitDomain, typeof activationRows>();
    for (const row of activationRows) {
      const list = m.get(row.domain) ?? [];
      list.push(row);
      m.set(row.domain, list);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [activationRows]);

  const maxSqrtW = useMemo(() => {
    const s = activationRows.map((r) => Math.sqrt(Math.max(0, r.displayWeight)));
    return Math.max(...s, 1e-6);
  }, [activationRows]);

  const blendRows = useMemo(() => {
    const v = model.embedding;
    const indexed = v.map((val, i) => ({
      i,
      val,
      dev: Math.abs(val - 0.5),
    }));
    indexed.sort((a, b) => a.i - b.i);
    return indexed.slice(0, topN);
  }, [model.embedding, topN]);

  const maxSqrtDev = Math.max(...blendRows.map((r) => Math.sqrt(r.dev)), 1e-6);

  const traitByIndex = useMemo(() => {
    const m = new Map<number, (typeof activationRows)[0]>();
    for (const row of activationRows) {
      m.set(row.activationIndex, row);
    }
    return m;
  }, [activationRows]);

  return (
    <div
      className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-inner"
      role="region"
      aria-label={strings['landscape.view_vector_aria']}
    >
      <p className="mb-2 text-xs text-slate-600">{strings['landscape.view_vector_caption']}</p>
      <h3 className="text-sm font-medium text-slate-800">{strings['landscape.view_vector_activation_heading']}</h3>
      <p className="mb-3 mt-1 text-[11px] leading-snug text-slate-600">
        {strings['landscape.view_vector_activation_caption']}
      </p>

      {regionsOrdered.length >= 2 ? (
        <div className="space-y-5">
          {regionsOrdered.map((region) => {
            const accent = TRAIT_DOMAIN_HEX[region.primaryDomain];
            return (
              <section key={region.id} className="rounded-lg border border-slate-200/90 bg-white/60 p-3 shadow-sm">
                <h4 className="text-xs font-semibold leading-snug text-slate-800">{region.label}</h4>
                <p className="mt-0.5 text-[10px] text-slate-500">{formatTraitDomainLabel(region.primaryDomain)}</p>
                <ul className="mt-2.5 space-y-2.5">
                  {region.pointIndices.map((ai) => {
                    const row = traitByIndex.get(ai);
                    if (!row) return null;
                    const sw = Math.sqrt(Math.max(0, row.displayWeight));
                    const barPct = Math.round(Math.max(26, Math.min(78, (sw / maxSqrtW) * 78)));
                    return (
                      <li key={row.traitId} className="flex items-start gap-2.5 text-xs">
                        <span
                          className="mt-1 h-2 w-2 shrink-0 rounded-full ring-1 ring-black/5"
                          style={{ backgroundColor: TRAIT_DOMAIN_HEX[row.domain] }}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-normal text-slate-800">{formatTraitLabel(row.traitId)}</div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${barPct}%`,
                                  backgroundColor: accent,
                                  opacity: 0.72,
                                }}
                              />
                            </div>
                            <span className="w-11 shrink-0 text-right font-mono tabular-nums text-slate-600">
                              {(row.displayWeight * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {activationByDomain.map(([domainKey, rows]) => (
            <section key={domainKey} className="space-y-2">
              <h4 className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {formatTraitDomainLabel(domainKey)}
              </h4>
              <ul className="space-y-2.5">
                {rows.map((row) => {
                  const sw = Math.sqrt(Math.max(0, row.displayWeight));
                  const barPct = Math.round(Math.max(26, Math.min(78, (sw / maxSqrtW) * 78)));
                  return (
                    <li key={row.traitId} className="flex items-start gap-2.5 text-xs">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full ring-1 ring-black/5"
                        style={{ backgroundColor: TRAIT_DOMAIN_HEX[row.domain] }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-normal text-slate-800">{formatTraitLabel(row.traitId)}</div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${barPct}%`,
                                backgroundColor: TRAIT_DOMAIN_HEX[row.domain],
                                opacity: 0.72,
                              }}
                            />
                          </div>
                          <span className="w-11 shrink-0 text-right font-mono tabular-nums text-slate-600">
                            {(row.displayWeight * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <details className="mt-4 rounded-md border border-slate-200 bg-white/70 px-3 py-2">
        <summary className="cursor-pointer select-none text-xs font-medium text-slate-700">
          {strings['landscape.view_vector_blend_heading']}
        </summary>
        <p className="mt-2 text-[11px] leading-snug text-slate-600">
          {strings['landscape.view_vector_blend_caption']}
        </p>
        <ul className="mt-2 space-y-2">
          {blendRows.map((r) => {
            const sd = Math.sqrt(r.dev);
            const barPct = Math.max(18, Math.min(72, (sd / maxSqrtDev) * 72));
            return (
              <li key={r.i} className="flex items-center gap-3 text-xs">
                <span className="w-14 shrink-0 font-mono tabular-nums text-slate-500">#{r.i}</span>
                <div className="min-w-0 flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-indigo-500/70"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
                <span className="w-16 shrink-0 text-right font-mono tabular-nums text-slate-700">
                  {r.val.toFixed(3)}
                </span>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
