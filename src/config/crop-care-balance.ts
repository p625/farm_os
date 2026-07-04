import { getScaledCropCareWorkDurationSimSeconds } from '@/config/time-balance.ts'
import { CropCareAction, type CropCareAction as CropCareActionValue } from '@/types/crop-care-action.ts'
import type { FieldCropCare } from '@/types/crop-care.ts'
/** Reference fertility (percent) for condition baseline mapping. */
export const REFERENCE_FERTILITY = 80

export const CROP_CONDITION = {
  fertilityWeight: 0.6,
  fertilizeBonus: 25,
  sprayBonus: 15,
  min: 0,
  max: 100,
} as const

export const CROP_CARE_YIELD = {
  fertilizeMultiplier: 1.12,
  sprayMultiplier: 1.08,
  combinedMultiplier: 1.2,
  fertilityMinFactor: 0.92,
  fertilityMaxFactor: 1.07,
} as const

export const CROP_CARE_WORK_DURATION = {
  [CropCareAction.Fertilize]: 4_800,
  [CropCareAction.Spray]: 5_200,
} as const

export function getFertilityYieldFactor(fertility: number): number {
  const t = Math.min(100, Math.max(0, fertility)) / 100
  return (
    CROP_CARE_YIELD.fertilityMinFactor +
    t * (CROP_CARE_YIELD.fertilityMaxFactor - CROP_CARE_YIELD.fertilityMinFactor)
  )
}

export function getFertilityConditionBaseline(fertility: number): number {
  return fertility * CROP_CONDITION.fertilityWeight
}

export function getCropCareActionConditionBonus(
  action: CropCareActionValue,
): number {
  switch (action) {
    case CropCareAction.Fertilize:
      return CROP_CONDITION.fertilizeBonus
    case CropCareAction.Spray:
      return CROP_CONDITION.sprayBonus
    default:
      return 0
  }
}

export function getCareYieldMultiplier(care: FieldCropCare): number {
  const fertilized = care.applied.includes(CropCareAction.Fertilize)
  const sprayed = care.applied.includes(CropCareAction.Spray)

  if (fertilized && sprayed) {
    return CROP_CARE_YIELD.combinedMultiplier
  }
  if (fertilized) {
    return CROP_CARE_YIELD.fertilizeMultiplier
  }
  if (sprayed) {
    return CROP_CARE_YIELD.sprayMultiplier
  }
  return 1
}

export function getCropCareWorkDurationBase(
  action: CropCareActionValue,
): number {
  return CROP_CARE_WORK_DURATION[action] ?? 1.3
}

export function getScaledCropCareWorkDuration(
  action: CropCareActionValue,
  fieldId: string,
  shopMultiplier = 1,
): number {
  return getScaledCropCareWorkDurationSimSeconds(action, fieldId, shopMultiplier)
}
