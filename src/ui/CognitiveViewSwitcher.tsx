'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CognitiveModel } from '@/core/cognitive-pipeline';
import { dominantRoutingDimension } from '@/core/cognitive-pipeline';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import type { ConfidenceComponents } from '@/scoring';
import type { UiStrings } from '@/lib/ui-strings';
import { ROUTING_DIM_HEX } from '@/ui/views/dim-colors';
import CognitiveFieldView from '@/ui/views/CognitiveFieldView';
import DensityView from '@/ui/views/DensityView';
import MapView from '@/ui/views/MapView';
import type { CognitiveViewType } from '@/ui/views/types';
import VectorView from '@/ui/views/VectorView';
import Terrain3DView from '@/ui/views/Terrain3DView';

const STORAGE_KEY = 'pcms-cognitive-view';

function readStoredView(): CognitiveViewType {
  if (typeof window === 'undefined') return 'map';
  const s = localStorage.getItem(STORAGE_KEY);
  if (s === 'map' || s === 'density' || s === 'field' || s === 'vector' || s === 'terrain3d') return s;
  return 'map';
}

export interface CognitiveViewSwitcherProps {
  model: CognitiveModel;
  display: DimensionDisplayModel;
  confidenceComponents: ConfidenceComponents;
  strings: UiStrings;
  /** Traits to ring-highlight when they match a mined co-activation pattern. */
  patternHighlightTraitIds?: ReadonlySet<string>;
  /** Optional one-line copy (already resolved with `formatUiString`). */
  patternBannerText?: string | null;
}

const VIEWS: CognitiveViewType[] = ['map', 'density', 'field', 'vector', 'terrain3d'];

export default function CognitiveViewSwitcher({
  model,
  display,
  confidenceComponents,
  strings,
  patternHighlightTraitIds,
  patternBannerText,
}: CognitiveViewSwitcherProps) {
  const [activeView, setActiveView] = useState<CognitiveViewType>(() => readStoredView());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activeView);
    } catch {
      /* ignore quota / private mode */
    }
  }, [activeView]);

  const userAccentColor = useMemo(() => {
    const d = dominantRoutingDimension(display, confidenceComponents);
    return ROUTING_DIM_HEX[d] ?? '#4f46e5';
  }, [display, confidenceComponents]);

  const setView = (v: CognitiveViewType) => {
    if (v === activeView) return;
    setActiveView(v);
  };

  const label = (v: CognitiveViewType) => {
    if (v === 'map') return strings['landscape.view_map'];
    if (v === 'density') return strings['landscape.view_density'];
    if (v === 'field') return strings['landscape.view_field'];
    if (v === 'vector') return strings['landscape.view_vector'];
    return strings['landscape.view_terrain3d'];
  };

  return (
    <div className="relative w-full">
      {!model.hasSessionEmbedding ? (
        <p className="mb-2 rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
          {strings['landscape.map_proxy_note']}
        </p>
      ) : null}

      <div
        className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-inner"
        role="tablist"
        aria-label={strings['landscape.view_switcher_aria']}
      >
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={activeView === v}
            onClick={() => setView(v)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              activeView === v
                ? 'bg-white/90 text-slate-800 ring-1 ring-slate-300/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label(v)}
          </button>
        ))}
      </div>

      {patternBannerText && (activeView === 'map' || activeView === 'density') ? (
        <p className="mb-2 rounded-md border border-amber-100 bg-amber-50/90 px-3 py-2 text-[11px] leading-snug text-amber-950 sm:text-xs">
          {patternBannerText}
        </p>
      ) : null}

      <div key={activeView} className="min-h-[min(22rem,calc(100vw-2.5rem))]">
        {activeView === 'map' ? (
          <MapView
            model={model}
            strings={strings}
            userAccentColor={userAccentColor}
            patternHighlightTraitIds={patternHighlightTraitIds}
          />
        ) : null}
        {activeView === 'density' ? (
          <DensityView
            model={model}
            strings={strings}
            display={display}
            confidenceComponents={confidenceComponents}
            patternHighlightTraitIds={patternHighlightTraitIds}
          />
        ) : null}
        {activeView === 'vector' ? (
          <VectorView model={model} strings={strings} />
        ) : null}
        {activeView === 'field' ? <CognitiveFieldView model={model} strings={strings} /> : null}
        {activeView === 'terrain3d' ? (
          <Terrain3DView model={model} strings={strings} userAccentColor={userAccentColor} />
        ) : null}
      </div>

      <p className="mt-2 text-center text-[11px] text-slate-500">{strings['landscape.map_density_hint']}</p>
    </div>
  );
}
