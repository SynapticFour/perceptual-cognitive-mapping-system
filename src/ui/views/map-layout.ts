/** Shared 2D plot box for map / density views (logical pixels before DPR). */
export const VIEW_BOX = 400;
export const VIEW_PAD = 28;
export const VIEW_INNER = VIEW_BOX - VIEW_PAD * 2;

export function toPlotPx(nx: number, ny: number): { x: number; y: number } {
  return {
    x: VIEW_PAD + nx * VIEW_INNER,
    y: VIEW_PAD + (1 - ny) * VIEW_INNER,
  };
}
