import { CROP_CATALOG } from '@/config/crop-catalog.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import type { MapValidationIssue } from '@/types/map-validation.ts'
import { parseFieldParcelProperties } from '@/types/parcel.ts'
import {
  FieldWorkState,
  isKnownCropId,
  parseFieldTestState,
} from '@/types/field-test-state.ts'

export function validateFieldTestStates(
  map: WorldMapDocument,
  pushIssue: (
    issue: Omit<MapValidationIssue, 'id'>,
  ) => void,
): void {
  for (const object of map.objects) {
    if (object.layer !== 'fields' || object.kind !== 'field') {
      continue
    }

    const props = parseFieldParcelProperties(object.properties)
    if (!props) {
      continue
    }

    const state = props.fieldTestState ?? parseFieldTestState(object.properties)

    if (state.cropId && !state.cropEnabled) {
      pushIssue({
        ruleId: 'field-crop-disabled-with-type',
        severity: 'error',
        objectId: object.id,
        message: `${object.name ?? object.id}: crop type is set but crop is disabled.`,
      })
    }

    if (state.cropEnabled && state.cropId && !isKnownCropId(state.cropId)) {
      pushIssue({
        ruleId: 'field-unknown-crop',
        severity: 'error',
        objectId: object.id,
        message: `${object.name ?? object.id}: unknown crop id "${state.cropId}".`,
      })
    }

    if (
      state.workState === FieldWorkState.ReadyToHarvest &&
      (!state.cropEnabled || !state.cropId)
    ) {
      pushIssue({
        ruleId: 'field-ready-without-crop',
        severity: 'error',
        objectId: object.id,
        message: `${object.name ?? object.id}: readyToHarvest work state without an active crop.`,
      })
    }

    if (
      state.lifecycleState === States.Grass &&
      state.cropEnabled &&
      state.cropId === 'wheat'
    ) {
      pushIssue({
        ruleId: 'field-grass-with-wheat',
        severity: 'warn',
        objectId: object.id,
        message: `${object.name ?? object.id}: grass meadow should not have wheat crop enabled.`,
      })
    }

    if (
      state.lifecycleState === States.Harvested &&
      (state.growthPercent > 0 || state.cropEnabled)
    ) {
      pushIssue({
        ruleId: 'field-harvested-growing',
        severity: 'warn',
        objectId: object.id,
        message: `${object.name ?? object.id}: harvested field still has active growth/crop.`,
      })
    }

    if (
      (state.lifecycleState === States.Seeded ||
        state.lifecycleState === States.Growing ||
        state.lifecycleState === States.Harvestable) &&
      !state.cropEnabled
    ) {
      pushIssue({
        ruleId: 'field-growth-without-crop',
        severity: 'warn',
        objectId: object.id,
        message: `${object.name ?? object.id}: growth stage requires cropEnabled.`,
      })
    }

    if (
      state.cropEnabled &&
      state.cropId &&
      state.lifecycleState === States.Harvestable &&
      !CROP_CATALOG.some((crop) => crop.id === state.cropId)
    ) {
      pushIssue({
        ruleId: 'field-harvest-crop-mismatch',
        severity: 'error',
        objectId: object.id,
        message: `${object.name ?? object.id}: harvestable crop type is invalid.`,
      })
    }
  }
}
