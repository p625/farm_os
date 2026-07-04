import { Color3, StandardMaterial, type Scene } from '@babylonjs/core'
import { FIELD_IDS } from '@/config/field-catalog.ts'
import { getCropDefinition } from '@/config/crop-catalog.ts'
import type { CropSystem } from '@systems/CropSystem.ts'
import type { FieldSystem } from '@systems/FieldSystem.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import {
  CropCareAction,
  hasCropCareAction,
  type FieldCropCare,
} from '@/types/crop-care.ts'
import type { CropColorPalette } from '@/types/crop.ts'

export class CropPresentation {
  private scene: Scene | null = null
  private fieldSystem: FieldSystem | null = null
  private cropSystem: CropSystem | null = null

  attach(
    scene: Scene,
    fieldSystem: FieldSystem,
    cropSystem: CropSystem,
  ): void {
    this.scene = scene
    this.fieldSystem = fieldSystem
    this.cropSystem = cropSystem
    this.syncVisuals()
  }

  syncVisuals(): void {
    if (!this.scene || !this.fieldSystem || !this.cropSystem) {
      return
    }

    for (const fieldId of FIELD_IDS) {
      const mesh = this.scene.getMeshByName(fieldId)
      const field = this.fieldSystem.getField(fieldId)
      if (!mesh?.material || !field || !this.cropSystem.isCropActive(field)) {
        continue
      }

      const cropId = this.cropSystem.normalizePlantedCropId(
        field.cropId,
        field.state,
      )
      const crop = cropId ? getCropDefinition(cropId) : undefined
      if (!crop) {
        continue
      }

      const style = getCropVisualStyle(
        crop.palette,
        field.state,
        field.growthPercent,
      )
      const material = mesh.material as StandardMaterial
      material.diffuseColor = style.diffuse.clone()
      material.specularColor = style.specular.clone()
      material.emissiveColor = applyCropCareEmissive(
        style.emissive.clone(),
        field.cropCare,
      )
    }
  }

  detach(): void {
    this.scene = null
    this.fieldSystem = null
    this.cropSystem = null
  }
}

interface CropVisualStyle {
  diffuse: Color3
  specular: Color3
  emissive: Color3
}

function rgb(color: { r: number; g: number; b: number }): Color3 {
  return new Color3(color.r, color.g, color.b)
}

export function getCropVisualStyle(
  palette: CropColorPalette,
  state: string,
  growthPercent: number,
): CropVisualStyle {
  const seeded = rgb(palette.seeded)
  const growing = rgb(palette.growing)
  const harvestable = rgb(palette.harvestable)

  if (state === States.Seeded) {
    return {
      diffuse: seeded,
      specular: new Color3(0.07, 0.05, 0.03),
      emissive: new Color3(0.02, 0.015, 0.01),
    }
  }

  if (state === States.Growing) {
    const t = growthPercent / 100
    return {
      diffuse: Color3.Lerp(seeded, growing, t),
      specular: Color3.Lerp(
        new Color3(0.07, 0.05, 0.03),
        new Color3(0.1, 0.14, 0.06),
        t,
      ),
      emissive: Color3.Lerp(
        new Color3(0.02, 0.015, 0.01),
        new Color3(0.03, 0.05, 0.015),
        t,
      ),
    }
  }

  if (state === States.Harvestable) {
    return {
      diffuse: harvestable,
      specular: new Color3(0.18, 0.15, 0.05),
      emissive: new Color3(0.08, 0.06, 0.02),
    }
  }

  return {
    diffuse: growing,
    specular: new Color3(0.1, 0.14, 0.06),
    emissive: new Color3(0.03, 0.05, 0.015),
  }
}

function applyCropCareEmissive(base: Color3, care: FieldCropCare): Color3 {
  const result = base.clone()
  if (hasCropCareAction(care, CropCareAction.Fertilize)) {
    result.g += 0.05
  }
  if (hasCropCareAction(care, CropCareAction.Spray)) {
    result.b += 0.04
  }
  return result
}
