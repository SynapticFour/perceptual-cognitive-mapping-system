'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CognitiveModel } from '@/core/cognitive-pipeline';
import { formatTraitLabel } from '@/core/traits/trait-mapping';
import { TRAIT_DOMAIN_HEX, formatTraitDomainLabel, type TraitDomain } from '@/core/traits/trait-domains';
import type { UiStrings } from '@/lib/ui-strings';
import { isPcmsDebugField } from '@/lib/pcms-debug';
import { activationPositionJitter } from '@/lib/cognitive-map-projection';
import { regionBoundaryPoints } from '@/lib/cognitive-regions';
import { fieldReferenceGlyphRadiiPx } from '@/ui/views/field-glyphs';
import { toPlotPx, VIEW_BOX, VIEW_INNER, VIEW_PAD } from '@/ui/views/map-layout';

const VIEW_MIN = VIEW_BOX / 4;

type ViewBoxState = { x: number; y: number; w: number; h: number };

function clampViewBox(v: ViewBoxState): ViewBoxState {
  const w = Math.min(VIEW_BOX, Math.max(VIEW_MIN, v.w));
  const h = Math.min(VIEW_BOX, Math.max(VIEW_MIN, v.h));
  const x = Math.min(Math.max(0, v.x), VIEW_BOX - w);
  const y = Math.min(Math.max(0, v.y), VIEW_BOX - h);
  return { x, y, w, h };
}

export interface MapViewProps {
  model: CognitiveModel;
  strings: UiStrings;
  userAccentColor: string;
  /** Ring-highlight activations whose trait id appears in a mined pattern. */
  patternHighlightTraitIds?: ReadonlySet<string>;
}

type TipState =
  | {
      kind: 'trait';
      traitId: string;
      domain: TraitDomain;
      weight: number;
      px: number;
      py: number;
    }
  | {
      kind: 'region';
      regionId: string;
      label: string;
      traitLabels: string[];
      px: number;
      py: number;
    }
  | null;

function boundaryPathD(
  boundary: { x: number; y: number }[],
  toPx: (p: { x: number; y: number }) => { x: number; y: number }
): string {
  if (boundary.length === 0) return '';
  const first = toPx(boundary[0]!);
  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < boundary.length; i++) {
    const p = toPx(boundary[i]!);
    d += ` L ${p.x} ${p.y}`;
  }
  d += ' Z';
  return d;
}

export default function MapView({ model, strings, userAccentColor, patternHighlightTraitIds }: MapViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewBox, setViewBox] = useState<ViewBoxState>({
    x: 0,
    y: 0,
    w: VIEW_BOX,
    h: VIEW_BOX,
  });
  const [tip, setTip] = useState<TipState>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const centroidPx = toPlotPx(model.centroid.x, model.centroid.y);
  const showSingleCenterGlow = model.cognitiveRegions.length < 2;
  const debugField = isPcmsDebugField();
  const refGlyph = fieldReferenceGlyphRadiiPx();

  const regionPaths = useMemo(() => {
    return model.cognitiveRegions.map((region) => {
      const pts = region.pointIndices.map((i) => model.projectedPoints[i]!);
      const boundary = regionBoundaryPoints(pts, region.displayStrength);
      const d = boundaryPathD(boundary, (p) => toPlotPx(p.x, p.y));
      const fill = TRAIT_DOMAIN_HEX[region.primaryDomain] ?? userAccentColor;
      const fillOp = 0.07 + 0.06 * region.displayStrength;
      return { region, d, fill, fillOp };
    });
  }, [model.cognitiveRegions, model.projectedPoints, userAccentColor]);

  const debugBounds = (() => {
    if (!debugField || model.activations.length === 0) return null;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < model.activations.length; i++) {
      const p = model.projectedPoints[i];
      if (!p) continue;
      const { x, y } = toPlotPx(p.x, p.y);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    if (!Number.isFinite(minX)) return null;
    const pad = 6;
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  })();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    console.log(
      '[PCMS constellation] MapView: rendering',
      model.activations.length,
      'activation point(s) (expected many, not 1)'
    );
  }, [model.fingerprint, model.activations.length]);

  const zoomBy = useCallback((scale: number, clientX: number, clientY: number) => {
    setViewBox((prev) => {
      const el = svgRef.current;
      if (!el) return prev;
      const rect = el.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const ux = prev.x + (sx / rect.width) * prev.w;
      const uy = prev.y + (sy / rect.height) * prev.h;
      const newW = Math.min(VIEW_BOX, Math.max(VIEW_MIN, prev.w * scale));
      const newH = newW;
      const nx = ux - (sx / rect.width) * newW;
      const ny = uy - (sy / rect.height) * newH;
      return clampViewBox({ x: nx, y: ny, w: newW, h: newH });
    });
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scale = e.deltaY < 0 ? 0.92 : 1 / 0.92;
      zoomBy(scale, e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  const viewBoxStr = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`;

  const tipPositionPct = (px: number, py: number) => ({
    left: `${((px - viewBox.x) / viewBox.w) * 100}%`,
    top: `${((py - viewBox.y) / viewBox.h) * 100}%`,
  });

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute right-1 top-1 z-20 flex flex-col gap-0.5 sm:flex-row sm:items-center">
        <button
          type="button"
          className="pointer-events-auto rounded border border-slate-200 bg-white/95 px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => {
            const el = svgRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            zoomBy(0.92, r.left + r.width / 2, r.top + r.height / 2);
          }}
          aria-label={strings['landscape.map_zoom_in']}
          title={strings['landscape.map_zoom_in']}
        >
          +
        </button>
        <button
          type="button"
          className="pointer-events-auto rounded border border-slate-200 bg-white/95 px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => {
            const el = svgRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            zoomBy(1 / 0.92, r.left + r.width / 2, r.top + r.height / 2);
          }}
          aria-label={strings['landscape.map_zoom_out']}
          title={strings['landscape.map_zoom_out']}
        >
          −
        </button>
        <button
          type="button"
          className="pointer-events-auto rounded border border-slate-200 bg-white/95 px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => setViewBox({ x: 0, y: 0, w: VIEW_BOX, h: VIEW_BOX })}
          aria-label={strings['landscape.map_zoom_reset']}
          title={strings['landscape.map_zoom_reset']}
        >
          ⟲
        </button>
      </div>
      <svg
        ref={svgRef}
        viewBox={viewBoxStr}
        preserveAspectRatio="xMidYMid meet"
        data-cognitive-map-export
        className="h-[min(22rem,calc(100vw-2.5rem))] w-full max-h-[28rem] touch-manipulation rounded-lg bg-gradient-to-b from-slate-50 to-indigo-50/40 shadow-inner ring-1 ring-slate-200/80"
        role="img"
        aria-label={strings['landscape.map_aria']}
        onPointerLeave={() => {
          setTip(null);
          setHoveredRegionId(null);
        }}
      >
        <defs>
          <radialGradient id="cognitive-constellation-centroid" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.035" />
            <stop offset="55%" stopColor="#94a3b8" stopOpacity="0.012" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect
          x={VIEW_PAD}
          y={VIEW_PAD}
          width={VIEW_INNER}
          height={VIEW_INNER}
          rx={12}
          ry={12}
          fill="none"
          stroke="rgba(148,163,184,0.35)"
          strokeWidth={1}
        />

        {showSingleCenterGlow ? (
          <circle
            cx={centroidPx.x}
            cy={centroidPx.y}
            r={88}
            fill="url(#cognitive-constellation-centroid)"
            pointerEvents="none"
          />
        ) : null}

        {regionPaths.map(({ region, d, fill, fillOp }) => {
          const c = toPlotPx(region.centroid.x, region.centroid.y);
          const dimmed = hoveredRegionId && hoveredRegionId !== region.id;
          const strokeOp = 0.22 + (hoveredRegionId === region.id ? 0.12 : 0);
          return (
            <g key={`reg-${region.id}`}>
              <path
                d={d}
                fill={fill}
                fillOpacity={dimmed ? fillOp * 0.45 : fillOp}
                stroke={fill}
                strokeOpacity={dimmed ? strokeOp * 0.5 : strokeOp}
                strokeWidth={hoveredRegionId === region.id ? 1.35 : 0.95}
                className="cursor-crosshair transition-[stroke-opacity,fill-opacity] duration-150"
                onPointerEnter={() => {
                  setHoveredRegionId(region.id);
                  setTip({
                    kind: 'region',
                    regionId: region.id,
                    label: region.label,
                    traitLabels: region.topTraitIds.map((id) => formatTraitLabel(id)),
                    px: c.x,
                    py: c.y,
                  });
                }}
              />
              <text
                x={c.x}
                y={c.y + 22}
                textAnchor="middle"
                className="pointer-events-none fill-slate-600"
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  opacity: dimmed ? 0.45 : 0.92,
                }}
              >
                {region.label.length > 42 ? `${region.label.slice(0, 40)}…` : region.label}
              </text>
            </g>
          );
        })}

        {model.traitEdges.map(([ia, ib], ei) => {
          const pa = toPlotPx(model.projectedPoints[ia]!.x, model.projectedPoints[ia]!.y);
          const pb = toPlotPx(model.projectedPoints[ib]!.x, model.projectedPoints[ib]!.y);
          return (
            <line
              key={`e-${ei}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="rgba(148,163,184,0.35)"
              strokeWidth={0.9}
              pointerEvents="none"
            />
          );
        })}

        {model.projectedPoints.map((p, i) => {
          const kind = model.kinds[i];
          if (kind === 'synthetic') return null;
          const { x, y } = toPlotPx(p.x, p.y);
          const label = model.labels[i] ?? '';
          if (kind === 'archetype') {
            return (
              <g key={`arch-${i}`}>
                <circle cx={x} cy={y} r={refGlyph.halo} fill="rgba(255,255,255,0.45)" />
                <circle cx={x} cy={y} r={refGlyph.core} fill="#64748b" stroke="#fff" strokeWidth={0.88} />
                <text x={x + 8} y={y - 6} className="fill-slate-600" style={{ fontSize: 8 }}>
                  {label.length > 24 ? `${label.slice(0, 22)}…` : label}
                </text>
              </g>
            );
          }
          if (kind === 'extra') {
            return (
              <g key={`ex-${i}`}>
                <circle cx={x} cy={y} r={refGlyph.halo} fill="rgba(255,255,255,0.45)" />
                <circle cx={x} cy={y} r={refGlyph.core} fill="#475569" stroke="#fff" strokeWidth={0.88} />
                <text x={x + 8} y={y - 6} className="fill-slate-600" style={{ fontSize: 8 }}>
                  {label.length > 24 ? `${label.slice(0, 22)}…` : label}
                </text>
              </g>
            );
          }
          return null;
        })}

        {model.activations.map((act, i) => {
          const p = model.projectedPoints[i];
          if (!p) return null;
          const w = model.pointWeights[i] ?? act.weight;
          const { x, y } = toPlotPx(p.x, p.y);
          const sw = Math.sqrt(Math.max(0, w));
          const baseR = 2.05;
          const smallScale = 1.28;
          const r = Math.max(1.85, baseR + sw * smallScale);
          const baseOp = 0.2;
          const opJ = activationPositionJitter(`${act.traitId}:opa`, i).jx;
          const op = Math.min(0.33, Math.max(0.14, baseOp + sw * 0.14 + opJ * 1.6));
          const traitId = act.traitId;
          const domain = act.domain;
          const fill = TRAIT_DOMAIN_HEX[domain] ?? userAccentColor;
          const inPattern = patternHighlightTraitIds?.has(traitId) ?? false;
          const region = model.cognitiveRegions.find((reg) => reg.pointIndices.includes(i));
          const dim =
            hoveredRegionId && region && region.id !== hoveredRegionId ? 0.55 : 1;
          return (
            <g key={`act-${traitId}-${i}`} data-pattern-match={inPattern ? 'true' : 'false'}>
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={fill}
                fillOpacity={op * dim}
                stroke="#fff"
                strokeWidth={0.88}
                strokeOpacity={0.5 * dim}
                className="cursor-crosshair"
                onPointerEnter={() => {
                  setHoveredRegionId(region?.id ?? null);
                  setTip({ kind: 'trait', traitId, domain, weight: w, px: x, py: y });
                }}
              />
            </g>
          );
        })}

        {debugBounds ? (
          <rect
            x={debugBounds.x}
            y={debugBounds.y}
            width={debugBounds.w}
            height={debugBounds.h}
            fill="none"
            stroke="rgba(239,68,68,0.45)"
            strokeWidth={1}
            strokeDasharray="4 3"
            pointerEvents="none"
          />
        ) : null}
      </svg>

      <p className="mt-1.5 px-1 text-center text-[10px] leading-snug text-slate-500">
        {strings['landscape.constellation_note']}
      </p>
      <p className="mt-0.5 px-1 text-center text-[10px] leading-snug text-slate-400">
        {strings['landscape.map_zoom_hint']}
      </p>

      {tip?.kind === 'trait' ? (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[11px] shadow-md"
          style={{
            ...tipPositionPct(tip.px, tip.py),
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="font-semibold text-slate-900">{formatTraitLabel(tip.traitId)}</div>
          <div className="text-slate-500" style={{ color: TRAIT_DOMAIN_HEX[tip.domain] }}>
            {formatTraitDomainLabel(tip.domain)}
          </div>
          <div className="text-slate-600">
            {strings['landscape.constellation_weight']}: {(tip.weight * 100).toFixed(0)}%
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-400">{tip.traitId}</div>
        </div>
      ) : null}

      {tip?.kind === 'region' ? (
        <div
          className="pointer-events-none absolute z-10 max-w-sm rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[11px] shadow-md"
          style={{
            ...tipPositionPct(tip.px, tip.py),
            transform: 'translate(-50%, -108%)',
          }}
        >
          <div className="font-semibold text-slate-900">{tip.label}</div>
          <div className="mt-1 text-slate-600">{tip.traitLabels.join(' · ')}</div>
        </div>
      ) : null}
    </div>
  );
}
