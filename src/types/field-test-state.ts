import { CROP_CATALOG } from '@/config/crop-catalog.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import type { FieldLifecycleState } from '@/types/field.ts'
import type { FieldSaveData } from '@/types/save.ts'

/** Studio-only hint for testers — not enforced by gameplay systems. */
export const FieldWorkState = {
  Idle: 'idle',
  NeedsPlowing: 'needsPlowing',
  NeedsSeeding: 'needsSeeding',
  NeedsFertilizing: 'needsFertilizing',
  NeedsSpraying: 'needsSpraying',
  ReadyToHarvest: 'readyToHarvest',
  Harvested: 'harvested',
} as const

export type FieldWorkState =
  (typeof FieldWorkState)[keyof typeof FieldWorkState]

export const FIELD_WORK_STATES = Object.values(FieldWorkState)

export function isFieldWorkState(value: unknown): value is FieldWorkState {
  return (
    typeof value === 'string' &&
    (FIELD_WORK_STATES as readonly string[]).includes(value)
  )
}

/** UI-friendly growth labels mapped to runtime lifecycle + growth percent. */
export const StudioGrowthStage = {
  None: 'none',
  Seeded: 'seeded',
  Sprouting: 'sprouting',
  Growing: 'growing',
  Mature: 'mature',
  ReadyToHarvest: 'readyToHarvest',
  Harvested: 'harvested',
  Withered: 'withered',
} as const

export type StudioGrowthStage =
  (typeof StudioGrowthStage)[keyof typeof StudioGrowthStage]

export const STUDIO_GROWTH_STAGES = Object.values(StudioGrowthStage)

export function isStudioGrowthStage(
  value: unknown,
): value is StudioGrowthStage {
  return (
    typeof value === 'string' &&
    (STUDIO_GROWTH_STAGES as readonly string[]).includes(value)
  )
}

/** UI-friendly soil labels mapped to runtime lifecycle. */
export const StudioSoilState = {
  Untilled: 'untilled',
  Plowed: 'plowed',
  Cultivated: 'cultivated',
  Seeded: 'seeded',
  Fertilized: 'fertilized',
  Sprayed: 'sprayed',
  Harvested: 'harvested',
} as const

export type StudioSoilState =
  (typeof StudioSoilState)[keyof typeof StudioSoilState]

export const STUDIO_SOIL_STATES = Object.values(StudioSoilState)

export function isStudioSoilState(value: unknown): value is StudioSoilState {
  return (
    typeof value === 'string' &&
    (STUDIO_SOIL_STATES as readonly string[]).includes(value)
  )
}

export interface FieldTestState {
  cropEnabled: boolean
  cropId: string | null
  lifecycleState: FieldLifecycleState
  growthPercent: number
  workState: FieldWorkState
}

export const DEFAULT_FIELD_TEST_STATE: FieldTestState = {
  cropEnabled: false,
  cropId: null,
  lifecycleState: States.Grass,
  growthPercent: 0,
  workState: FieldWorkState.Idle,
}

const KNOWN_CROP_IDS = new Set(CROP_CATALOG.map((crop) => crop.id))

export function isKnownCropId(cropId: string | null): boolean {
  return cropId !== null && KNOWN_CROP_IDS.has(cropId)
}

export function parseFieldTestState(
  properties: Record<string, unknown> | undefined,
): FieldTestState {
  const raw = properties?.fieldTestState
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_FIELD_TEST_STATE }
  }

  const record = raw as Record<string, unknown>
  const cropEnabled = record.cropEnabled === true
  const cropId =
    typeof record.cropId === 'string' && isKnownCropId(record.cropId)
      ? record.cropId
      : cropEnabled
        ? 'wheat'
        : null
  const lifecycleState = isFieldLifecycleState(record.lifecycleState)
    ? record.lifecycleState
    : DEFAULT_FIELD_TEST_STATE.lifecycleState
  const growthPercent =
    typeof record.growthPercent === 'number'
      ? Math.max(0, Math.min(100, record.growthPercent))
      : DEFAULT_FIELD_TEST_STATE.growthPercent
  const workState = isFieldWorkState(record.workState)
    ? record.workState
    : DEFAULT_FIELD_TEST_STATE.workState

  return {
    cropEnabled,
    cropId: cropEnabled ? cropId : null,
    lifecycleState,
    growthPercent,
    workState,
  }
}

export function serializeFieldTestState(
  state: FieldTestState,
): Record<string, unknown> {
  return {
    cropEnabled: state.cropEnabled,
    cropId: state.cropEnabled ? state.cropId : null,
    lifecycleState: state.lifecycleState,
    growthPercent: state.growthPercent,
    workState: state.workState,
  }
}

function isFieldLifecycleState(
  value: unknown,
): value is FieldLifecycleState {
  return (
    typeof value === 'string' &&
    (Object.values(States) as readonly string[]).includes(value)
  )
}

export function growthStageFromTestState(
  state: FieldTestState,
): StudioGrowthStage {
  if (!state.cropEnabled || !state.cropId) {
    return StudioGrowthStage.None
  }
  switch (state.lifecycleState) {
    case States.Seeded:
      return state.growthPercent < 15
        ? StudioGrowthStage.Seeded
        : StudioGrowthStage.Sprouting
    case States.Growing:
      return state.growthPercent >= 85
        ? StudioGrowthStage.Mature
        : StudioGrowthStage.Growing
    case States.Harvestable:
      return StudioGrowthStage.ReadyToHarvest
    case States.Harvested:
      return StudioGrowthStage.Harvested
    case States.Plowed:
      return StudioGrowthStage.None
    case States.Grass:
      return StudioGrowthStage.None
    default:
      return StudioGrowthStage.None
  }
}

export function soilStateFromTestState(state: FieldTestState): StudioSoilState {
  switch (state.lifecycleState) {
    case States.Grass:
      return StudioSoilState.Untilled
    case States.Plowed:
      return StudioSoilState.Plowed
    case States.Seeded:
      return StudioSoilState.Seeded
    case States.Growing:
      return state.growthPercent > 60
        ? StudioSoilState.Fertilized
        : StudioSoilState.Cultivated
    case States.Harvestable:
      return StudioSoilState.Sprayed
    case States.Harvested:
      return StudioSoilState.Harvested
    default:
      return StudioSoilState.Untilled
  }
}

export function applyGrowthStage(
  stage: StudioGrowthStage,
  cropId: string | null,
): Pick<FieldTestState, 'lifecycleState' | 'growthPercent' | 'cropEnabled' | 'cropId'> {
  switch (stage) {
    case StudioGrowthStage.None:
      return {
        cropEnabled: false,
        cropId: null,
        lifecycleState: States.Grass,
        growthPercent: 0,
      }
    case StudioGrowthStage.Seeded:
      return {
        cropEnabled: true,
        cropId,
        lifecycleState: States.Seeded,
        growthPercent: 5,
      }
    case StudioGrowthStage.Sprouting:
      return {
        cropEnabled: true,
        cropId,
        lifecycleState: States.Seeded,
        growthPercent: 20,
      }
    case StudioGrowthStage.Growing:
      return {
        cropEnabled: true,
        cropId,
        lifecycleState: States.Growing,
        growthPercent: 45,
      }
    case StudioGrowthStage.Mature:
      return {
        cropEnabled: true,
        cropId,
        lifecycleState: States.Growing,
        growthPercent: 90,
      }
    case StudioGrowthStage.ReadyToHarvest:
      return {
        cropEnabled: true,
        cropId,
        lifecycleState: States.Harvestable,
        growthPercent: 100,
      }
    case StudioGrowthStage.Harvested:
      return {
        cropEnabled: false,
        cropId: null,
        lifecycleState: States.Harvested,
        growthPercent: 0,
      }
    case StudioGrowthStage.Withered:
      return {
        cropEnabled: true,
        cropId,
        lifecycleState: States.Harvested,
        growthPercent: 0,
      }
    default:
      return {
        cropEnabled: false,
        cropId: null,
        lifecycleState: States.Grass,
        growthPercent: 0,
      }
  }
}

export function applySoilState(soil: StudioSoilState): FieldLifecycleState {
  switch (soil) {
    case StudioSoilState.Untilled:
      return States.Grass
    case StudioSoilState.Plowed:
    case StudioSoilState.Cultivated:
      return States.Plowed
    case StudioSoilState.Seeded:
      return States.Seeded
    case StudioSoilState.Fertilized:
    case StudioSoilState.Sprayed:
      return States.Growing
    case StudioSoilState.Harvested:
      return States.Harvested
    default:
      return States.Grass
  }
}

export function fieldTestStateToSaveSlice(
  fieldId: string,
  state: FieldTestState,
): FieldSaveData {
  return {
    id: fieldId,
    state: state.lifecycleState,
    growthPercent: state.growthPercent,
    cropId: state.cropEnabled ? state.cropId : null,
    daysGrown: estimateDaysGrown(state),
    cropCare: { applied: [] },
  }
}

function estimateDaysGrown(state: FieldTestState): number {
  if (!state.cropEnabled || !state.cropId) {
    return 0
  }
  const crop = CROP_CATALOG.find((entry) => entry.id === state.cropId)
  if (!crop) {
    return 0
  }
  return Math.round((state.growthPercent / 100) * crop.growingDays)
}

export interface FieldTestPreset {
  id: string
  label: string
  state: FieldTestState
}

export const FIELD_TEST_PRESETS: readonly FieldTestPreset[] = [
  {
    id: 'empty_plowed',
    label: 'Empty plowed field',
    state: {
      cropEnabled: false,
      cropId: null,
      lifecycleState: States.Plowed,
      growthPercent: 0,
      workState: FieldWorkState.NeedsSeeding,
    },
  },
  {
    id: 'seeded_wheat',
    label: 'Seeded wheat',
    state: {
      cropEnabled: true,
      cropId: 'wheat',
      lifecycleState: States.Seeded,
      growthPercent: 8,
      workState: FieldWorkState.Idle,
    },
  },
  {
    id: 'growing_wheat',
    label: 'Growing wheat',
    state: {
      cropEnabled: true,
      cropId: 'wheat',
      lifecycleState: States.Growing,
      growthPercent: 55,
      workState: FieldWorkState.Idle,
    },
  },
  {
    id: 'ready_wheat',
    label: 'Ready wheat harvest',
    state: {
      cropEnabled: true,
      cropId: 'wheat',
      lifecycleState: States.Harvestable,
      growthPercent: 100,
      workState: FieldWorkState.ReadyToHarvest,
    },
  },
  {
    id: 'ready_canola',
    label: 'Ready canola harvest',
    state: {
      cropEnabled: true,
      cropId: 'canola',
      lifecycleState: States.Harvestable,
      growthPercent: 100,
      workState: FieldWorkState.ReadyToHarvest,
    },
  },
  {
    id: 'ready_corn',
    label: 'Ready corn harvest',
    state: {
      cropEnabled: true,
      cropId: 'corn',
      lifecycleState: States.Harvestable,
      growthPercent: 100,
      workState: FieldWorkState.ReadyToHarvest,
    },
  },
  {
    id: 'freshly_harvested',
    label: 'Freshly harvested',
    state: {
      cropEnabled: false,
      cropId: null,
      lifecycleState: States.Harvested,
      growthPercent: 0,
      workState: FieldWorkState.Harvested,
    },
  },
  {
    id: 'grass_meadow',
    label: 'Grass meadow',
    state: {
      cropEnabled: false,
      cropId: null,
      lifecycleState: States.Grass,
      growthPercent: 0,
      workState: FieldWorkState.Idle,
    },
  },
]
