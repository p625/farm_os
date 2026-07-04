import { Color3 } from '@babylonjs/core'

const CROP_CARGO_COLORS: Record<string, Color3> = {
  wheat: new Color3(0.85, 0.75, 0.35),
  barley: new Color3(0.78, 0.62, 0.28),
  canola: new Color3(0.92, 0.82, 0.2),
  soybean: new Color3(0.55, 0.62, 0.22),
  corn: new Color3(0.9, 0.72, 0.18),
  potato: new Color3(0.72, 0.55, 0.38),
}

const DEFAULT_CARGO_COLOR = new Color3(0.75, 0.65, 0.3)

export function getCargoColorForCrop(cropId: string | null): Color3 {
  if (!cropId) {
    return DEFAULT_CARGO_COLOR.clone()
  }
  return (CROP_CARGO_COLORS[cropId] ?? DEFAULT_CARGO_COLOR).clone()
}
