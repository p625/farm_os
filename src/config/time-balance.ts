import { CropCareAction, type CropCareAction as CropCareActionValue } from '@/types/crop-care-action.ts'
import { getFieldCatalogEntry } from '@/config/field-catalog.ts'
import {
  DEFAULT_REAL_MINUTES_PER_GAME_DAY,
  SIMULATION_SECONDS_PER_DAY,
} from '@/types/simulation-clock.ts'

/**
 * Work durations in simulation-seconds (86400 sim-sec = 1 game day).
 * Calibrated for 45 real min/game day at 1×: ~5 real min plow on 10 ha.
 */
export const WORK_DURATION_SIM_SECONDS: Record<string, number> = {
  plow: 7_200,
  seed: 5_400,
  harvest: 10_800,
  fertilize: 4_800,
  spray: 5_200,
  load_from_combine: 2_400,
  unload_to_silo: 2_400,
}

export const CROP_CARE_WORK_DURATION_SIM_SECONDS: Record<CropCareActionValue, number> = {
  [CropCareAction.Fertilize]: 4_800,
  [CropCareAction.Spray]: 5_200,
}

/** 1 Babylon world unit = 1 meter (Art pipeline). */
export const METERS_PER_WORLD_UNIT = 1

/**
 * Stock travel speed at 1× and the 45 min/day design target.
 * Shop tractor-speed upgrades (up to +60%) reach ~40 km/h.
 */
export const REFERENCE_MACHINE_TRAVEL_SPEED_KMH = 25

/** Convert real-world km/h (at 1×) to world-units per simulation-second. */
export function kmhToWorldUnitsPerSimulationSecond(
  kmh: number,
  realMinutesPerGameDay = DEFAULT_REAL_MINUTES_PER_GAME_DAY,
): number {
  const simulationSecondsPerRealSecond =
    SIMULATION_SECONDS_PER_DAY / (realMinutesPerGameDay * 60)
  return kmh / (simulationSecondsPerRealSecond * 3.6)
}

/** World units per simulation-second — ~25 km/h real at 1× / 45 min day. */
export const MACHINE_MOVE_SPEED_SIM = kmhToWorldUnitsPerSimulationSecond(
  REFERENCE_MACHINE_TRAVEL_SPEED_KMH,
)

export const LOGISTICS_ARRIVAL_THRESHOLD = 0.15

const REFERENCE_AREA_HA = 10
const MAX_AREA_WORK_SCALE = 1.6

export function getFieldAreaWorkScale(area: number): number {
  return Math.min(MAX_AREA_WORK_SCALE, Math.sqrt(area / REFERENCE_AREA_HA))
}

export function getScaledFieldWorkDurationSimSeconds(
  jobType: string,
  fieldId: string | null,
  shopMultiplier = 1,
): number {
  const base = WORK_DURATION_SIM_SECONDS[jobType] ?? 6_000
  const area = fieldId
    ? (getFieldCatalogEntry(fieldId)?.area ?? REFERENCE_AREA_HA)
    : REFERENCE_AREA_HA
  return base * getFieldAreaWorkScale(area) * shopMultiplier
}

export function getScaledCropCareWorkDurationSimSeconds(
  action: CropCareActionValue,
  fieldId: string,
  shopMultiplier = 1,
): number {
  const base = CROP_CARE_WORK_DURATION_SIM_SECONDS[action] ?? 4_800
  const area = getFieldCatalogEntry(fieldId)?.area ?? REFERENCE_AREA_HA
  return base * getFieldAreaWorkScale(area) * shopMultiplier
}

export function simulationSecondsToRealSeconds(
  simulationSeconds: number,
  realMinutesPerGameDay: number,
  timeScale: number,
): number {
  if (timeScale <= 0) {
    return Infinity
  }
  const simPerReal = 86_400 / (realMinutesPerGameDay * 60)
  return simulationSeconds / (simPerReal * timeScale)
}
