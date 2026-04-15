import type { RoutingWeightKey } from '@/adaptive/routing-tags';
import { formatUiString, type UiStrings } from '@/lib/ui-strings';

export type DimensionUiCopy = {
  key: RoutingWeightKey;
  title: string;
  shortLabel: string;
  lowLabel: string;
  highLabel: string;
};

function dimPart(strings: UiStrings, dim: RoutingWeightKey, part: 'title' | 'short_label' | 'low_label' | 'high_label'): string {
  const key = `dims.${dim}.${part}`;
  const v = strings[key];
  return typeof v === 'string' ? v : '';
}

/** Plain-language labels for a routing dimension (from UI strings). */
export function getDimensionUi(dim: RoutingWeightKey, strings: UiStrings): DimensionUiCopy {
  return {
    key: dim,
    title: dimPart(strings, dim, 'title'),
    shortLabel: dimPart(strings, dim, 'short_label'),
    lowLabel: dimPart(strings, dim, 'low_label'),
    highLabel: dimPart(strings, dim, 'high_label'),
  };
}

/** Low ↔ high label pair for charts and tooltips. */
export function formatDimensionLabelPair(strings: UiStrings, dim: RoutingWeightKey): string {
  const meta = getDimensionUi(dim, strings);
  return formatUiString(strings['radar.label_pair'], { low: meta.lowLabel, high: meta.highLabel });
}
