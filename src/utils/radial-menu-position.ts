const DEFAULT_MARGIN_PX = 96

export function clampRadialAnchor(
  screenX: number,
  screenY: number,
  margin = DEFAULT_MARGIN_PX,
): { x: number; y: number } {
  const maxX = Math.max(margin, window.innerWidth - margin)
  const maxY = Math.max(margin, window.innerHeight - margin)

  return {
    x: Math.min(Math.max(margin, screenX), maxX),
    y: Math.min(Math.max(margin, screenY), maxY),
  }
}
