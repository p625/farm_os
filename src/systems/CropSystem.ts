import {
  CROP_CATALOG,
  DEFAULT_CROP_ID,
  getCropDefinition,
} from '@/config/crop-catalog.ts'
import type { Field } from '@entities/Field.ts'
import type { FieldLifecycleState } from '@/types/field.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import {
  GrowthCurve,
  type CropDefinition,
  type CropSnapshot,
} from '@/types/crop.ts'
import type { FarmShopSystem } from './FarmShopSystem.ts'
import type { CropCareContext } from '@/types/crop-care.ts'
import { computeCropCareYieldMultiplier } from '@/types/crop-care.ts'
import { GameSystem } from './GameSystem.ts'

export class CropSystem extends GameSystem {
  readonly name = 'CropSystem'
  private farmShopSystem: FarmShopSystem | null = null

  setFarmShopSystem(farmShopSystem: FarmShopSystem): void {
    this.farmShopSystem = farmShopSystem
  }

  initialize(): void {
    // Crop definitions are static catalog data.
  }

  update(_deltaTime: number): void {
    // Crop growth is advanced by FieldSystem on day ticks.
  }

  dispose(): void {
    this.farmShopSystem = null
  }

  getAllCrops(): readonly CropDefinition[] {
    return CROP_CATALOG
  }

  getCrop(cropId: string): CropDefinition | undefined {
    return getCropDefinition(cropId)
  }

  getDefaultCropId(): string {
    return DEFAULT_CROP_ID
  }

  normalizeCropId(cropId: string | null): string | null {
    if (!cropId) {
      return null
    }
    return getCropDefinition(cropId) ? cropId : DEFAULT_CROP_ID
  }

  normalizePlantedCropId(cropId: string | null, state: FieldLifecycleState): string | null {
    if (
      cropId === null &&
      (state === States.Seeded ||
        state === States.Growing ||
        state === States.Harvestable)
    ) {
      return DEFAULT_CROP_ID
    }
    return this.normalizeCropId(cropId)
  }

  toSnapshots(): CropSnapshot[] {
    return CROP_CATALOG.map((crop) => this.toSnapshot(crop))
  }

  toSnapshot(crop: CropDefinition): CropSnapshot {
    return {
      id: crop.id,
      name: crop.name,
      seedCost: crop.seedCost,
      growingDays: crop.growingDays,
      yield: crop.yield,
      sellingPrice: crop.sellingPrice,
      harvestValue: this.getHarvestValue(crop.id),
      profitEstimate: this.getProfitEstimate(crop.id),
      displayColor: crop.displayColor,
    }
  }

  canPlant(
    cropId: string,
    fieldState: FieldLifecycleState,
    money: number,
  ): boolean {
    const crop = getCropDefinition(cropId)
    if (!crop) {
      return false
    }
    return fieldState === crop.requiredFieldState && money >= crop.seedCost
  }

  getHarvestValue(cropId: string): number {
    const crop = getCropDefinition(cropId)
    if (!crop) {
      return 0
    }
    return crop.yield * crop.sellingPrice
  }

  getYield(cropId: string, careContext?: CropCareContext | null): number {
    const base = getCropDefinition(cropId)?.yield ?? 0
    const shopMultiplier = this.farmShopSystem?.getYieldMultiplier() ?? 1
    const careMultiplier = careContext
      ? computeCropCareYieldMultiplier(careContext)
      : 1
    return Math.max(1, Math.round(base * shopMultiplier * careMultiplier))
  }

  getProfitEstimate(cropId: string): number {
    const crop = getCropDefinition(cropId)
    if (!crop) {
      return 0
    }
    return this.getHarvestValue(cropId) - crop.seedCost
  }

  getCropName(cropId: string): string {
    return getCropDefinition(cropId)?.name ?? cropId
  }

  computeGrowthPercent(cropId: string, daysGrown: number): number {
    const crop = getCropDefinition(cropId)
    if (!crop) {
      return 0
    }

    const t = Math.min(1, Math.max(0, daysGrown / crop.growingDays))
    let curved: number

    switch (crop.growthCurve) {
      case GrowthCurve.Early:
        curved = Math.sqrt(t)
        break
      case GrowthCurve.Late:
        curved = t * t
        break
      case GrowthCurve.Linear:
      default:
        curved = t
        break
    }

    return Math.min(100, Math.round(curved * 100))
  }

  estimateDaysGrown(cropId: string, growthPercent: number): number {
    const crop = getCropDefinition(cropId)
    if (!crop || growthPercent <= 0) {
      return 0
    }

    let days = 0

    for (let day = 0; day <= crop.growingDays; day += 1) {
      if (this.computeGrowthPercent(cropId, day) >= growthPercent) {
        days = day
        break
      }
      days = day
    }

    return days
  }

  isCropActive(field: Field): boolean {
    const cropId = this.normalizePlantedCropId(field.cropId, field.state)
    if (!cropId) {
      return false
    }
    return (
      field.state === States.Seeded ||
      field.state === States.Growing ||
      field.state === States.Harvestable
    )
  }
}
