'use client';

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  COGNITIVE_DIMENSION_METADATA,
  PRIMARY_RESULTS_ROUTING_KEYS,
  RESEARCH_ROUTING_KEYS,
  type CognitiveDimension,
} from '@/model/cognitive-dimensions';
import { getDimensionUi } from '@/lib/cognitive-dimensions-ui';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import {
  buildSharePayload,
  buildShareableResultsUrl,
  encodeLandscapeSharePayload,
  type LandscapeSharePayload,
} from '@/lib/landscape-share-codec';
import type { CognitiveProfilePublic } from '@/types/profile-public';
import type { ConfidenceComponents } from '@/scoring';
import type { UiStrings } from '@/lib/ui-strings';
import { buildCognitiveModel, type CognitiveMapExtraPoint } from '@/core/cognitive-pipeline';
import { describePatternTraits, matchUserToPatterns } from '@/core/patterns/pattern-matching';
import {
  getDiscoveredPatterns,
  getPatternStoreVersion,
  recordUserSignature,
  subscribePatternStore,
} from '@/core/patterns/pattern-store';
import { extractUserSignature } from '@/core/patterns/user-signature';
import { formatUiString } from '@/lib/ui-strings';
import CognitiveViewSwitcher from '@/ui/CognitiveViewSwitcher';

const DIM_HEX: Record<string, string> = {
  F: '#2563eb',
  P: '#7c3aed',
  S: '#db2777',
  E: '#ea580c',
  R: '#059669',
  C: '#ca8a04',
  T: '#0d9488',
  I: '#e11d48',
  A: '#4f46e5',
  V: '#0891b2',
};

export interface CognitiveLandscapeProps {
  profile: CognitiveProfilePublic;
  confidenceComponents: ConfidenceComponents;
  display: DimensionDisplayModel;
  strings: UiStrings;
  /** Latent embedding from `answers → embedding` (omit for URL-only shares). */
  embeddingVector?: number[] | null;
  embeddingDimension?: number;
  /** Optional cohort overlay for research-style comparisons. */
  mapExtraPoints?: CognitiveMapExtraPoint[];
  /** Optional extra fields merged into the JSON export (no PII). */
  jsonExportExtra?: Record<string, unknown>;
  /** ISO timestamp embedded in the share payload (defaults to “now”). */
  shareCompletedAt?: string;
}

function plausibleUpper(score01: number, confidence: number): number {
  return score01 + (1 - confidence) * 0.5 * (1 - score01);
}

async function downloadSvgAsPng(svg: SVGElement, filename: string): Promise<void> {
  const rect = svg.getBoundingClientRect();
  const w = Math.max(640, Math.round(rect.width * 2));
  const h = Math.max(480, Math.round(rect.height * 2));
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  const xml = new XMLSerializer().serializeToString(clone);
  const svg64 = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('SVG rasterisation failed'));
    i.src = svg64;
  });

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}

export default function CognitiveLandscape({
  profile: _profile,
  confidenceComponents,
  display,
  strings,
  embeddingVector = null,
  embeddingDimension = 64,
  mapExtraPoints,
  jsonExportExtra,
  shareCompletedAt,
}: CognitiveLandscapeProps) {
  void _profile;
  const chartWrapRef = useRef<HTMLDivElement>(null);

  const sharePayload: LandscapeSharePayload = useMemo(
    () => buildSharePayload(display, confidenceComponents, shareCompletedAt ?? new Date().toISOString()),
    [display, confidenceComponents, shareCompletedAt]
  );

  const cognitiveModel = useMemo(
    () =>
      buildCognitiveModel({
        embeddingVector: embeddingVector ?? null,
        embeddingDimension,
        display,
        confidenceComponents,
        extraPoints: mapExtraPoints,
      }),
    [confidenceComponents, display, embeddingDimension, embeddingVector, mapExtraPoints]
  );

  const lastRecordedFingerprintRef = useRef<string | null>(null);
  const patternStoreVersion = useSyncExternalStore(
    subscribePatternStore,
    getPatternStoreVersion,
    getPatternStoreVersion
  );

  useEffect(() => {
    const fp = cognitiveModel.fingerprint;
    if (lastRecordedFingerprintRef.current === fp) return;
    lastRecordedFingerprintRef.current = fp;
    const sig = extractUserSignature(cognitiveModel.activations);
    if (sig.length >= 2) {
      recordUserSignature(sig);
    }
  }, [cognitiveModel]);

  const patternOverlay = useMemo(() => {
    void patternStoreVersion;
    const sig = extractUserSignature(cognitiveModel.activations);
    const patterns = getDiscoveredPatterns();
    const matches = matchUserToPatterns(sig, patterns, 5);
    const best = matches[0];
    if (!best) {
      return { highlightTraitIds: null as ReadonlySet<string> | null, bannerText: null as string | null };
    }
    const traitsTitle = describePatternTraits(best.pattern.traits);
    const bannerText = formatUiString(strings['landscape.pattern_banner'] ?? '', {
      traits: traitsTitle,
      support: String(best.pattern.support),
      pct: String(Math.round(best.pattern.strength * 100)),
      score: String(Math.round(best.score * 100)),
    });
    return { highlightTraitIds: new Set(best.pattern.traits) as ReadonlySet<string>, bannerText };
  }, [cognitiveModel, patternStoreVersion, strings]);

  const handleDownloadJson = useCallback(() => {
    const doc = {
      format: 'PCMS_landscape_profile',
      version: 1,
      generatedAt: new Date().toISOString(),
      share: sharePayload,
      ...jsonExportExtra,
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pcms-profile.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [jsonExportExtra, sharePayload]);

  const handleCopyShareUrl = useCallback(() => {
    const encoded = encodeLandscapeSharePayload(sharePayload);
    const built = buildShareableResultsUrl(window.location.href, encoded);
    if (!built.ok) {
      alert(strings['landscape.share_url_too_long']);
      return;
    }
    void navigator.clipboard.writeText(built.url).then(
      () => {
        alert(strings['landscape.share_copied']);
      },
      () => {
        alert(built.url);
      }
    );
  }, [sharePayload, strings]);

  const handleDownloadPng = useCallback(async () => {
    const canvas = chartWrapRef.current?.querySelector(
      'canvas[data-cognitive-map-export]'
    ) as HTMLCanvasElement | null;
    if (canvas) {
      try {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cognitive-landscape.png';
        a.click();
      } catch {
        alert(strings['landscape.export_png_error']);
      }
      return;
    }
    const svg = chartWrapRef.current?.querySelector('svg[data-cognitive-map-export]') as SVGSVGElement | null;
    if (!svg) {
      alert(strings['landscape.export_png_error']);
      return;
    }
    try {
      await downloadSvgAsPng(svg, 'cognitive-landscape.png');
    } catch {
      alert(strings['landscape.export_png_error']);
    }
  }, [strings]);

  const renderLandscapeBar = (dim: CognitiveDimension) => {
    const meta = getDimensionUi(dim, strings);
    const raw = display.rawPercent[dim] / 100;
    const conf = confidenceComponents[dim].finalConfidence;
    const upper = plausibleUpper(raw, conf);
    const rawPct = display.rawPercent[dim];
    const upperPct = Math.min(100, upper * 100);
    const ghostWidth = Math.max(0, upperPct - rawPct);
    const hex = DIM_HEX[dim] ?? '#475569';
    const plain = COGNITIVE_DIMENSION_METADATA[dim].description;

    return (
      <li
        key={dim}
        className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 shadow-inner"
        title={plain}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-900">{meta.title}</h4>
          <span className="text-sm font-semibold tabular-nums text-slate-800">{rawPct.toFixed(0)}%</span>
        </div>
        <div
          className="relative mt-2 h-10 w-full overflow-hidden rounded-md bg-slate-200/90"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(rawPct)}
          aria-label={meta.title}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-l-md transition-[width] duration-700 ease-out"
            style={{
              width: `${rawPct}%`,
              backgroundColor: hex,
              opacity: 0.25 + conf * 0.65,
            }}
          />
          {ghostWidth > 0.5 ? (
            <div
              className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,#cbd5e1_0px,#cbd5e1_5px,#e2e8f0_5px,#e2e8f0_10px)] opacity-80"
              style={{ left: `${rawPct}%`, width: `${ghostWidth}%` }}
              aria-hidden
            />
          ) : null}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-slate-600">
          <span>{meta.lowLabel}</span>
          <span>{meta.highLabel}</span>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-slate-600">{plain}</p>
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white px-4 py-5 shadow-sm sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
          {strings['landscape.hero_title']}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700 sm:text-base">
          {strings['landscape.hero_body']}
        </p>
      </header>

      <section
        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5"
        aria-labelledby="landscape-map-heading"
      >
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 id="landscape-map-heading" className="text-base font-semibold text-slate-900">
            {strings['landscape.map_heading']}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleDownloadPng()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 sm:text-sm"
            >
              {strings['landscape.export_png']}
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 sm:text-sm"
            >
              {strings['landscape.export_json']}
            </button>
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 sm:text-sm"
            >
              {strings['landscape.copy_share_url']}
            </button>
          </div>
        </div>
        <p className="mb-3 text-xs text-slate-600 sm:text-sm">{strings['landscape.map_caption']}</p>
        <div
          ref={chartWrapRef}
          className="relative mx-auto w-full max-w-full min-w-0 touch-pan-y"
          role="presentation"
        >
          <CognitiveViewSwitcher
            model={cognitiveModel}
            display={display}
            confidenceComponents={confidenceComponents}
            strings={strings}
            patternHighlightTraitIds={patternOverlay.highlightTraitIds ?? undefined}
            patternBannerText={patternOverlay.bannerText}
          />
        </div>
      </section>

      <section
        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5"
        aria-labelledby="landscape-bars-heading"
      >
        <h3 id="landscape-bars-heading" className="mb-2 text-base font-semibold text-slate-900">
          {strings['landscape.bars_heading']}
        </h3>
        <p className="mb-4 text-xs text-slate-600 sm:text-sm">{strings['landscape.bars_caption']}</p>
        <ul className="grid grid-cols-1 gap-3 sm:gap-4">
          {PRIMARY_RESULTS_ROUTING_KEYS.map((dim) => renderLandscapeBar(dim))}
        </ul>
        <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-sm text-slate-800">
          <summary className="cursor-pointer select-none rounded-md px-2 py-2 font-medium text-slate-900 hover:bg-slate-100">
            {strings['landscape.research_routing_disclosure_summary']}
          </summary>
          <ul className="mt-2 grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 sm:gap-4">
            {RESEARCH_ROUTING_KEYS.map((dim) => renderLandscapeBar(dim))}
          </ul>
        </details>
      </section>

    </div>
  );
}
