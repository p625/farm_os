import {
  CROP_CONDITION,
  getCareYieldMultiplier,
  getCropCareActionConditionBonus,
  getFertilityConditionBaseline,
  getFertilityYieldFactor,
} from '@/config/crop-care-balance.ts'
import type { FieldLifecycleState } from '@/types/field.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'

export * from '@/types/crop-care-action.ts'
import { CropCareAction as CropCareActions } from '@/types/crop-care-action.ts'
import type { CropCareAction as CropCareActionType } from '@/types/crop-care-action.ts'

export interface FieldCropCare {
  /** Care actions applied during the current crop cycle. */
  applied: readonly CropCareActionType[]
}

export interface CropCareContext {
  catalogFertility: number
  care: FieldCropCare
}

export function emptyFieldCropCare(): FieldCropCare {
  return { applied: [] }
}

export function hasCropCareAction(
  care: FieldCropCare,
  action: CropCareActionType,
): boolean {
  return care.applied.includes(action)
}

export function applyCropCareAction(
  care: FieldCropCare,
  action: CropCareActionType,
): FieldCropCare {
  if (hasCropCareAction(care, action)) {
    return care
  }
  return { applied: [...care.applied, action] }
}

export function normalizeFieldCropCare(care: unknown): FieldCropCare {
  if (!care || typeof care !== 'object') {
    return emptyFieldCropCare()
  }

  const applied = (care as FieldCropCare).applied
  if (!Array.isArray(applied)) {
    return emptyFieldCropCare()
  }

  const valid = applied.filter(
    (entry): entry is CropCareActionType =>
      entry === CropCareActions.Fertilize || entry === CropCareActions.Spray,
  )

  return { applied: [...new Set(valid)] }
}

export function isCropCareWindow(state: FieldLifecycleState): boolean {
  return (
    state === States.Seeded ||
    state === States.Growing ||
    state === States.Harvestable
  )
}

/** Derived HUD metric — never persisted. */
export function computeCropCondition(ctx: CropCareContext): number {
  let score = getFertilityConditionBaseline(ctx.catalogFertility)
  for (const action of ctx.care.applied) {
    score += getCropCareActionConditionBonus(action)
  }
  return Math.min(
    CROP_CONDITION.max,
    Math.max(CROP_CONDITION.min, Math.round(score)),
  )
}

export function computeCropCareYieldMultiplier(ctx: CropCareContext): number {
  return getFertilityYieldFactor(ctx.catalogFertility) * getCareYieldMultiplier(ctx.care)
}
