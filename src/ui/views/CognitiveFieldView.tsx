'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import type { CognitiveModel } from '@/core/cognitive-pipeline';
import { formatTraitLabel } from '@/core/traits/trait-mapping';
import { TRAIT_DOMAIN_HEX } from '@/core/traits/trait-domains';
import { buildCognitiveFieldGrid } from '@/lib/cognitive-field';
import { regionBoundaryPoints } from '@/lib/cognitive-regions';
import type { UiStrings } from '@/lib/ui-strings';
import { toPlotPx, VIEW_BOX, VIEW_INNER, VIEW_PAD } from '@/ui/views/map-layout';

export interface CognitiveFieldViewProps {
  model: CognitiveModel;
  strings: UiStrings;
}

type RegionTip = { id: string; label: string; topTraits: string[]; strengthPct: number } | null;
type RegionHit = { x: number; y: number; r: number; id: string; label: string; topTraits: string[]; strengthPct: number };

export default function CognitiveFieldView({ model, strings }: CognitiveFieldViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const phaseRef = useRef(0);
  const regionHitsRef = useRef<RegionHit[]>([]);
  const [tip, setTip] = useState<RegionTip>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const field = useMemo(() => buildCognitiveFieldGrid(model), [model]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    canvas.width = Math.round(VIEW_BOX * dpr);
    canvas.height = Math.round(VIEW_BOX * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW_BOX, VIEW_BOX);

    const bg = ctx.createLinearGradient(0, 0, 0, VIEW_BOX);
    bg.addColorStop(0, '#f8fafc');
    bg.addColorStop(1, '#eef2ff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, VIEW_BOX, VIEW_BOX);

    const pulse = 1 + 0.045 * Math.sin(phaseRef.current);
    const { rows, cols, intensity, color, maxIntensity } = field;
    const cw = VIEW_INNER / cols;
    const ch = VIEW_INNER / rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = intensity[y]![x]!;
        if (v <= 1e-9) continue;
        const t = Math.min(1, (v / Math.max(1e-9, maxIntensity)) * pulse);
        const shimmer = 0.93 + 0.07 * Math.sin(phaseRef.current * 0.7 + x * 0.11 + y * 0.09);
        const alpha = Math.min(0.36, Math.max(0.02, 0.015 + t * 0.36 * shimmer));
        ctx.fillStyle = color[y]![x]!;
        ctx.globalAlpha = alpha;
        ctx.fillRect(VIEW_PAD + x * cw, VIEW_PAD + y * ch, cw + 1, ch + 1);
      }
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(VIEW_PAD + 0.5, VIEW_PAD + 0.5, VIEW_INNER - 1, VIEW_INNER - 1);

    const totalStrength = model.cognitiveRegions.reduce((s, r) => s + r.strength, 0) || 1;
    const hits: RegionHit[] = [];
    for (const region of model.cognitiveRegions) {
      const points = region.pointIndices.map((i) => model.projectedPoints[i]!);
      const boundary = regionBoundaryPoints(points, region.displayStrength);
      const px = boundary.map((p) => toPlotPx(p.x, p.y));
      if (px.length >= 2) {
        const domainColor = TRAIT_DOMAIN_HEX[region.primaryDomain];
        const dimmed = hoveredRegion && hoveredRegion !== region.id;
        ctx.beginPath();
        ctx.moveTo(px[0]!.x, px[0]!.y);
        for (let i = 1; i < px.length; i++) ctx.lineTo(px[i]!.x, px[i]!.y);
        ctx.closePath();
        ctx.fillStyle = domainColor;
        ctx.globalAlpha = dimmed ? 0.02 : 0.04 + region.displayStrength * 0.03;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = domainColor;
        ctx.globalAlpha = dimmed ? 0.2 : hoveredRegion === region.id ? 0.72 : 0.42;
        ctx.lineWidth = hoveredRegion === region.id ? 1.8 : 1.15;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const c = toPlotPx(region.centroid.x, region.centroid.y);
      hits.push({
        x: c.x,
        y: c.y,
        r: 25 + region.displayStrength * 24,
        id: region.id,
        label: region.label,
        topTraits: region.topTraitIds.map((t) => formatTraitLabel(t)),
        strengthPct: (region.strength / totalStrength) * 100,
      });
    }
    regionHitsRef.current = hits;

    for (let i = 0; i < model.activations.length; i++) {
      const p = model.projectedPoints[i];
      if (!p) continue;
      const { x, y } = toPlotPx(p.x, p.y);
      const w = Math.sqrt(Math.max(0, model.pointWeights[i] ?? model.activations[i]!.weight));
      const r = Math.max(1.3, 1.35 + 0.55 * w);
      ctx.beginPath();
      ctx.fillStyle = TRAIT_DOMAIN_HEX[model.activations[i]!.domain];
      ctx.globalAlpha = hoveredRegion ? 0.16 : 0.2;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }, [field, model, hoveredRegion]);

  useLayoutEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const step = () => {
      phaseRef.current += 0.015;
      draw();
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    console.log('[PCMS field view]', {
      localMaxima: field.metrics.localMaxima,
      maxPeakShare: field.metrics.maxPeakShare,
      coverage: field.metrics.coverage,
      sigma: field.sigma,
      passed: field.metrics.passed,
    });
  }, [field]);

  const onPointerMove = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = VIEW_BOX / rect.width;
    const sy = VIEW_BOX / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    let best: RegionHit | null = null;
    let bestD = Infinity;
    for (const h of regionHitsRef.current) {
      const dx = x - h.x;
      const dy = y - h.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= h.r * h.r && d2 < bestD) {
        bestD = d2;
        best = h;
      }
    }
    if (!best) {
      setTip(null);
      setHoveredRegion(null);
      return;
    }
    setHoveredRegion(best.id);
    setTip({
      id: best.id,
      label: best.label,
      topTraits: best.topTraits,
      strengthPct: best.strengthPct,
    });
  }, []);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        data-cognitive-map-export
        width={VIEW_BOX}
        height={VIEW_BOX}
        className="h-[min(22rem,calc(100vw-2.5rem))] w-full max-h-[28rem] touch-manipulation rounded-lg shadow-inner ring-1 ring-slate-200/80"
        style={{ aspectRatio: '1 / 1' }}
        aria-label={strings['landscape.map_aria']}
        role="img"
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          setTip(null);
          setHoveredRegion(null);
        }}
      />
      <p className="mt-1.5 px-1 text-center text-xs leading-snug text-slate-600">
        {strings['landscape.field_caption'] ?? strings['landscape.map_density_hint']}
      </p>
      {tip ? (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs shadow-sm" role="tooltip">
          <div className="font-semibold text-slate-900">{tip.label}</div>
          <div className="mt-1 text-slate-600">{tip.topTraits.join(' · ')}</div>
          <div className="mt-1 text-slate-500">
            {strings['landscape.constellation_weight']}: {tip.strengthPct.toFixed(0)}%
          </div>
        </div>
      ) : null}
    </div>
  );
}

