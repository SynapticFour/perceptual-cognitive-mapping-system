'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import type { CognitiveModel } from '@/core/cognitive-pipeline';
import { formatTraitLabel } from '@/core/traits/trait-mapping';
import { TRAIT_DOMAIN_HEX, formatTraitDomainLabel, type TraitDomain } from '@/core/traits/trait-domains';
import type { UiStrings } from '@/lib/ui-strings';
import { activationPositionJitter } from '@/lib/cognitive-map-projection';
import { isPcmsDebugField } from '@/lib/pcms-debug';
import { fieldReferenceGlyphRadiiPx } from '@/ui/views/field-glyphs';
import { toPlotPx, VIEW_BOX, VIEW_INNER, VIEW_PAD } from '@/ui/views/map-layout';
import { regionBoundaryPoints } from '@/lib/cognitive-regions';
import { formatDimensionLabelPair, getDimensionUi } from '@/lib/cognitive-dimensions-ui';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import type { ConfidenceComponents } from '@/scoring';

const HEAT_RGB = { r: 100, g: 100, b: 255 };

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  if (h.length !== 6) return { r: 99, g: 102, b: 241 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function topContributingDimensions(
  display: DimensionDisplayModel,
  confidenceComponents: ConfidenceComponents,
  strings: UiStrings,
  k = 5
) {
  const rows = ROUTING_WEIGHT_KEYS.map((dim) => {
    const raw = display.rawPercent[dim] ?? 50;
    const conf = confidenceComponents[dim].finalConfidence;
    const score = Math.abs(raw - 50) * (0.35 + 0.65 * conf);
    const meta = getDimensionUi(dim, strings);
    return {
      dim,
      title: meta.title,
      score,
      lowHigh: formatDimensionLabelPair(strings, dim),
    };
  });
  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, k);
}

type RegionHitZone = {
  x: number;
  y: number;
  r: number;
  label: string;
  traitLabels: string[];
};

export interface DensityViewProps {
  model: CognitiveModel;
  strings: UiStrings;
  display: DimensionDisplayModel;
  confidenceComponents: ConfidenceComponents;
  patternHighlightTraitIds?: ReadonlySet<string>;
}

type Tip =
  | { kind: 'trait'; traitId: string; domain: TraitDomain; weight: number }
  | { kind: 'region'; label: string; traitLabels: string[] }
  | null;

type HitZone = {
  x: number;
  y: number;
  r: number;
  traitId: string;
  weight: number;
  domain: TraitDomain;
};

export default function DensityView({
  model,
  strings,
  display,
  confidenceComponents,
  patternHighlightTraitIds,
}: DensityViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fadeRef = useRef(0);
  const rafRef = useRef(0);
  const hitRef = useRef<HitZone[]>([]);
  const regionHitRef = useRef<RegionHitZone[]>([]);

  const [tip, setTip] = useState<Tip>(null);
  const debugField = isPcmsDebugField();
  const topDims = useMemo(
    () => topContributingDimensions(display, confidenceComponents, strings),
    [display, confidenceComponents, strings]
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    console.log(
      '[PCMS constellation] DensityView: rendering',
      model.activations.length,
      'activation point(s) (expected many, not 1)'
    );
  }, [model.fingerprint, model.activations.length]);

  const canvasPts = useMemo(
    () =>
      model.projectedPoints.map((p, i) => ({
        ...toPlotPx(p.x, p.y),
        kind: model.kinds[i]!,
        label: model.labels[i] ?? '',
        weight: model.pointWeights[i] ?? 0,
        domain: model.kinds[i] === 'activation' ? model.activationDomains[i]! : undefined,
      })),
    [model]
  );

  const draw = useCallback(() => {
    void patternHighlightTraitIds;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const refGlyph = fieldReferenceGlyphRadiiPx();

    const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    canvas.width = Math.round(VIEW_BOX * dpr);
    canvas.height = Math.round(VIEW_BOX * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW_BOX, VIEW_BOX);

    const g = ctx.createLinearGradient(0, 0, 0, VIEW_BOX);
    g.addColorStop(0, '#f8fafc');
    g.addColorStop(1, '#eef2ff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_BOX, VIEW_BOX);

    const fade = fadeRef.current;
    const { grid, cols, rows, maxD } = model.density;
    const cw = VIEW_INNER / cols;
    const ch = VIEW_INNER / rows;
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const t = Math.min(1, grid[gy][gx] / maxD);
        const alpha = Math.min(1, t) * 0.6 * fade;
        if (alpha < 0.002) continue;
        ctx.fillStyle = `rgba(${HEAT_RGB.r},${HEAT_RGB.g},${HEAT_RGB.b},${alpha})`;
        ctx.fillRect(VIEW_PAD + gx * cw, VIEW_PAD + gy * ch, cw + 1, ch + 1);
      }
    }

    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(VIEW_PAD + 0.5, VIEW_PAD + 0.5, VIEW_INNER - 1, VIEW_INNER - 1);

    for (const p of canvasPts) {
      if (p.kind !== 'synthetic') continue;
      ctx.fillStyle = 'rgba(148,163,184,0.22)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const [ia, ib] of model.traitEdges) {
      const a = canvasPts[ia]!;
      const b = canvasPts[ib]!;
      ctx.strokeStyle = 'rgba(148,163,184,0.35)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    for (const region of model.cognitiveRegions) {
      const pts = region.pointIndices.map((i) => model.projectedPoints[i]!);
      const boundary = regionBoundaryPoints(pts, region.displayStrength);
      const pxPts = boundary.map((p) => toPlotPx(p.x, p.y));
      if (pxPts.length < 2) continue;
      const rgb = hexToRgb(TRAIT_DOMAIN_HEX[region.primaryDomain]);
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.05 + 0.05 * region.displayStrength})`;
      ctx.beginPath();
      ctx.moveTo(pxPts[0]!.x, pxPts[0]!.y);
      for (let i = 1; i < pxPts.length; i++) {
        ctx.lineTo(pxPts[i]!.x, pxPts[i]!.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (const p of canvasPts) {
      if (p.kind !== 'archetype') continue;
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, refGlyph.halo, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.88;
      ctx.beginPath();
      ctx.arc(p.x, p.y, refGlyph.core, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    for (const p of canvasPts) {
      if (p.kind !== 'extra') continue;
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, refGlyph.halo, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.88;
      ctx.beginPath();
      ctx.arc(p.x, p.y, refGlyph.core, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (model.cognitiveRegions.length < 2) {
      const c = toPlotPx(model.centroid.x, model.centroid.y);
      const glowR = 72;
      const grd = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, glowR);
      grd.addColorStop(0, 'rgba(148,163,184,0.04)');
      grd.addColorStop(0.45, 'rgba(148,163,184,0.015)');
      grd.addColorStop(1, 'rgba(148,163,184,0)');
      ctx.fillStyle = grd;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(c.x, c.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (let i = 0; i < model.activations.length; i++) {
      const act = model.activations[i]!;
      const proj = model.projectedPoints[i];
      if (!proj) continue;
      const { x, y } = toPlotPx(proj.x, proj.y);
      const w = model.pointWeights[i] ?? act.weight;
      const sw = Math.sqrt(Math.max(0, w));
      const r = Math.max(1.75, 1.95 + sw * 1.22);
      const rgb = hexToRgb(TRAIT_DOMAIN_HEX[act.domain]);
      const opJ = activationPositionJitter(`${act.traitId}:dopa`, i).jx;
      ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
      ctx.globalAlpha = Math.min(0.32, Math.max(0.14, 0.19 + sw * 0.16 + opJ * 1.5));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.48)';
      ctx.lineWidth = 0.86;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (debugField && model.activations.length > 0) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < model.activations.length; i++) {
        const proj = model.projectedPoints[i];
        if (!proj) continue;
        const { x, y } = toPlotPx(proj.x, proj.y);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      if (Number.isFinite(minX)) {
        const pad = 6;
        ctx.strokeStyle = 'rgba(239,68,68,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
        ctx.setLineDash([]);
      }
    }

    ctx.font = '500 8px system-ui, sans-serif';
    ctx.fillStyle = '#475569';
    for (const p of canvasPts) {
      if (p.kind !== 'archetype' && p.kind !== 'extra') continue;
      const text = p.label.length > 24 ? `${p.label.slice(0, 22)}…` : p.label;
      ctx.fillText(text, p.x + 7, p.y - 5);
    }

    ctx.font = '500 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const region of model.cognitiveRegions) {
      const c = toPlotPx(region.centroid.x, region.centroid.y);
      const label =
        region.label.length > 36 ? `${region.label.slice(0, 34)}…` : region.label;
      ctx.fillStyle = '#475569';
      ctx.fillText(label, c.x, c.y + 20);
    }
    ctx.textAlign = 'left';

    const hits: HitZone[] = [];
    for (let i = 0; i < model.activations.length; i++) {
      const act = model.activations[i]!;
      const proj = model.projectedPoints[i];
      if (!proj) continue;
      const { x, y } = toPlotPx(proj.x, proj.y);
      const w = model.pointWeights[i] ?? act.weight;
      const sw = Math.sqrt(Math.max(0, w));
      hits.push({
        x,
        y,
        r: 8 + sw * 4.5,
        traitId: act.traitId,
        weight: w,
        domain: act.domain,
      });
    }
    hitRef.current = hits;
    regionHitRef.current = model.cognitiveRegions.map((region) => {
      const c = toPlotPx(region.centroid.x, region.centroid.y);
      return {
        x: c.x,
        y: c.y,
        r: 28 + region.displayStrength * 22,
        label: region.label,
        traitLabels: region.topTraitIds.map((id) => formatTraitLabel(id)),
      };
    });
  }, [canvasPts, model, debugField, patternHighlightTraitIds]);

  useLayoutEffect(() => {
    fadeRef.current = 0;
    draw();
  }, [draw, model.fingerprint]);

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      fadeRef.current = 1;
      draw();
      return;
    }
    const start = performance.now();
    const step = (t: number) => {
      fadeRef.current = Math.min(1, (t - start) / 480);
      draw();
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, model.fingerprint]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  const onCanvasPointerMove = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = VIEW_BOX / rect.width;
    const sy = VIEW_BOX / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;

    let bestTrait: Tip = null;
    let bestTraitD = Infinity;
    for (const h of hitRef.current) {
      const dx = x - h.x;
      const dy = y - h.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= h.r * h.r && d2 < bestTraitD) {
        bestTraitD = d2;
        bestTrait = { kind: 'trait', traitId: h.traitId, domain: h.domain, weight: h.weight };
      }
    }
    if (bestTrait) {
      setTip(bestTrait);
      return;
    }
    let bestRegion: Tip = null;
    let bestRegionD = Infinity;
    for (const h of regionHitRef.current) {
      const dx = x - h.x;
      const dy = y - h.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= h.r * h.r && d2 < bestRegionD) {
        bestRegionD = d2;
        bestRegion = { kind: 'region', label: h.label, traitLabels: h.traitLabels };
      }
    }
    setTip(bestRegion);
  }, []);

  return (
    <div className="relative w-full" onPointerLeave={() => setTip(null)}>
      <canvas
        ref={canvasRef}
        data-cognitive-map-export
        width={VIEW_BOX}
        height={VIEW_BOX}
        className="h-[min(22rem,calc(100vw-2.5rem))] w-full max-h-[28rem] touch-manipulation rounded-lg shadow-inner ring-1 ring-slate-200/80"
        style={{ aspectRatio: '1 / 1' }}
        aria-label={strings['landscape.map_aria']}
        role="img"
        onPointerMove={onCanvasPointerMove}
        onPointerLeave={() => setTip(null)}
      />
      <p className="mt-1.5 px-1 text-center text-xs leading-snug text-slate-600">
        {strings['landscape.constellation_note']}
      </p>

      <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50/90 px-2 py-1.5 text-left text-[11px] text-slate-700">
        <summary className="cursor-pointer select-none font-medium text-slate-800">
          {strings['landscape.map_top_signals']}
        </summary>
        <ul className="mt-1.5 space-y-1 pl-1">
          {topDims.map((row) => (
            <li key={row.dim} className="flex flex-wrap gap-x-2 gap-y-0.5">
              <span className="font-normal text-slate-600">{row.title}</span>
              <span className="text-slate-500">{row.lowHigh}</span>
            </li>
          ))}
        </ul>
      </details>

      {tip?.kind === 'trait' ? (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs shadow-sm" role="tooltip">
          <div className="font-semibold text-slate-900">{formatTraitLabel(tip.traitId)}</div>
          <div className="text-slate-500" style={{ color: TRAIT_DOMAIN_HEX[tip.domain] }}>
            {formatTraitDomainLabel(tip.domain)}
          </div>
          <div className="text-slate-600">
            {strings['landscape.constellation_weight']}: {(tip.weight * 100).toFixed(0)}%
          </div>
          <div className="mt-0.5 font-mono text-xs text-slate-600">{tip.traitId}</div>
        </div>
      ) : null}
      {tip?.kind === 'region' ? (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs shadow-sm" role="tooltip">
          <div className="font-semibold text-slate-900">{tip.label}</div>
          <div className="mt-1 text-slate-600">{tip.traitLabels.join(' · ')}</div>
        </div>
      ) : null}
    </div>
  );
}
