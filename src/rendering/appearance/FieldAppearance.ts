import { Color3 } from '@babylonjs/core'
import { FieldLifecycleState as States } from '@/types/field.ts'
import type { FieldLifecycleState } from '@/types/field.ts'

export interface FieldVisualStyle {
  diffuse: Color3
  specular: Color3
  emissive: Color3
}

const GRASS = new Color3(0.32, 0.58, 0.24)
const PLOWED = new Color3(0.42, 0.28, 0.16)
const SEEDED = new Color3(0.46, 0.34, 0.18)
const GROWING = new Color3(0.38, 0.62, 0.22)
const HARVESTABLE = new Color3(0.86, 0.72, 0.18)
const HARVESTED = new Color3(0.48, 0.4, 0.22)

export const FIELD_VISUAL_STYLES: Record<FieldLifecycleState, FieldVisualStyle> =
  {
    [States.Grass]: {
      diffuse: GRASS,
      specular: new Color3(0.08, 0.12, 0.06),
      emissive: new Color3(0.02, 0.04, 0.01),
    },
    [States.Plowed]: {
      diffuse: PLOWED,
      specular: new Color3(0.06, 0.04, 0.02),
      emissive: Color3.Black(),
    },
    [States.Seeded]: {
      diffuse: SEEDED,
      specular: new Color3(0.07, 0.05, 0.03),
      emissive: new Color3(0.02, 0.015, 0.01),
    },
    [States.Growing]: {
      diffuse: GROWING,
      specular: new Color3(0.1, 0.14, 0.06),
      emissive: new Color3(0.03, 0.05, 0.015),
    },
    [States.Harvestable]: {
      diffuse: HARVESTABLE,
      specular: new Color3(0.18, 0.15, 0.05),
      emissive: new Color3(0.08, 0.06, 0.02),
    },
    [States.Harvested]: {
      diffuse: HARVESTED,
      specular: new Color3(0.06, 0.05, 0.03),
      emissive: Color3.Black(),
    },
  }

export function getFieldVisualStyle(
  state: FieldLifecycleState,
  growthPercent: number,
): FieldVisualStyle {
  if (state === States.Growing) {
    const t = growthPercent / 100
    const seeded = FIELD_VISUAL_STYLES[States.Seeded]
    const growing = FIELD_VISUAL_STYLES[States.Growing]
    return {
      diffuse: Color3.Lerp(seeded.diffuse, growing.diffuse, t),
      specular: Color3.Lerp(seeded.specular, growing.specular, t),
      emissive: Color3.Lerp(seeded.emissive, growing.emissive, t),
    }
  }

  return FIELD_VISUAL_STYLES[state]
}
