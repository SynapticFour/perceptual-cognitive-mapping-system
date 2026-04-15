/** Accessible green / amber / red scale for routing confidence (not sole cue — pair with text). */
export function confidenceHue(confidence: number): 'high' | 'mid' | 'low' {
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.5) return 'mid';
  return 'low';
}

export function confidenceFillClass(confidence: number): string {
  const h = confidenceHue(confidence);
  if (h === 'high') return 'bg-emerald-800 text-white';
  if (h === 'mid') return 'bg-amber-600 text-gray-950';
  return 'bg-rose-700 text-white';
}

export function confidenceStrokeHex(confidence: number): string {
  const h = confidenceHue(confidence);
  if (h === 'high') return '#065f46';
  if (h === 'mid') return '#d97706';
  return '#be123c';
}
