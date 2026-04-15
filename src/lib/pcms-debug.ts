/**
 * Field-layout debug overlay (bounding box + console metrics).
 * Enable with `NEXT_PUBLIC_PCMS_DEBUG_FIELD=true` or `PCMS_DEBUG_FIELD=true`.
 */
export function isPcmsDebugField(): boolean {
  if (typeof process === 'undefined') return false;
  return (
    process.env.NEXT_PUBLIC_PCMS_DEBUG_FIELD === 'true' || process.env.PCMS_DEBUG_FIELD === 'true'
  );
}
