'use client';

import type { CohortModel } from '@/cohort/types';
import { describeCohortRegionForTooltip } from '@/cohort/ux-insights';

export interface CohortCognitiveLandscapeRegionsProps {
  cohortModel: CohortModel;
  /** Accessible name for the figure. */
  ariaLabel: string;
}

/**
 * Aggregate-only field: regional highlights (2–5 clusters). No individual points.
 */
export default function CohortCognitiveLandscapeRegions({
  cohortModel,
  ariaLabel,
}: CohortCognitiveLandscapeRegionsProps) {
  const regions = cohortModel.regions.slice(0, 5);
  const totalW = regions.reduce((s, r) => s + r.weight, 0) || 1;
  const w = 360;
  const h = 240;
  const pad = 16;

  if (regions.length === 0) {
    return (
      <p className="text-sm text-slate-600" role="status">
        {cohortModel.summaryExplanation}
      </p>
    );
  }

  const maxR = Math.max(...regions.map((r) => Math.sqrt(r.weight / totalW)), 1e-6);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      className="max-h-64 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/40"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <filter id="cohort-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
        </filter>
      </defs>
      {regions.map((r, i) => {
        const cx = pad + r.centroid.x * (w - 2 * pad);
        const cy = pad + (1 - r.centroid.y) * (h - 2 * pad);
        const rel = Math.sqrt(r.weight / totalW) / maxR;
        const radius = 14 + 38 * rel;
        const { description, relativeSizeLabel } = describeCohortRegionForTooltip(r, totalW);
        const tip = `${description} ${relativeSizeLabel}.`;
        return (
          <g key={r.id}>
            <circle
              cx={cx}
              cy={cy}
              r={radius + 6}
              fill={`hsla(${210 + i * 32}, 62%, 72%, 0.35)`}
              filter="url(#cohort-soft)"
            />
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill={`hsla(${200 + i * 30}, 58%, 68%, 0.55)`}
              stroke="rgba(15,23,42,0.28)"
              strokeWidth={1.5}
            >
              <title>{tip}</title>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
