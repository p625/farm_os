import { FIELD_CATALOG, getFieldCatalogEntry } from '@/config/field-catalog.ts'
import { FARM_HUB } from '@/config/map-01-layout.ts'

export {
  FARM_HUB,
  FIELD_LAYOUT,
  FIELD_POSITIONS,
  MAP_01_WORLD_BOUNDS,
  getFieldLayoutEntry,
  getFieldHalfExtents,
  getWorldCenter,
  getWorldTerrainSize,
} from '@/config/map-01-layout.ts'

export const TRACTOR_HOME = FARM_HUB.tractorHome.position
export const TRACTOR_HOME_ROTATION_Y =
  FARM_HUB.tractorHome.rotationY ?? -Math.PI / 6

export const GRAIN_COMBINE_HOME = FARM_HUB.grainCombineHome.position
export const CORN_COMBINE_HOME = FARM_HUB.cornCombineHome.position

export const GRAIN_COMBINE_HOME_ROTATION_Y =
  FARM_HUB.grainCombineHome.rotationY ?? -Math.PI / 6
export const CORN_COMBINE_HOME_ROTATION_Y =
  FARM_HUB.cornCombineHome.rotationY ?? -Math.PI / 6

export const EQUIPMENT_YARD_SPAWN_POSITIONS = FARM_HUB.equipmentYard

export const ATTACHMENT_SLOT_OFFSETS: Record<
  string,
  { x: number; y: number; z: number }
> = {
  front_hitch: { x: 0, y: 0.3, z: 2.2 },
  rear_hitch: { x: 0, y: 0.25, z: -1.8 },
  trailer_hitch: { x: 0, y: 0.4, z: -3.8 },
  header_slot: { x: 0, y: 0.35, z: 2.5 },
}

export const DETACH_OFFSET = { x: 2.5, y: 0, z: 0 } as const

export const FIELD_DEFINITIONS = FIELD_CATALOG.map(({ id, name }) => ({
  id,
  name,
}))

export const TRACTOR_MOVE_SPEED = 10

export const JOB_WORK_DURATION: Record<string, number> = {
  plow: 1.5,
  seed: 1.2,
  harvest: 2,
  load_from_combine: 1,
  unload_to_silo: 1,
}

export const LOGISTICS_ARRIVAL_THRESHOLD = 0.15

const REFERENCE_AREA_HA = 10
const MAX_AREA_WORK_SCALE = 1.6

export function getFieldAreaWorkScale(area: number): number {
  return Math.min(MAX_AREA_WORK_SCALE, Math.sqrt(area / REFERENCE_AREA_HA))
}

export function getScaledFieldWorkDuration(
  jobType: string,
  fieldId: string | null,
  shopMultiplier = 1,
): number {
  const base = JOB_WORK_DURATION[jobType] ?? 1.5
  const area = fieldId
    ? (getFieldCatalogEntry(fieldId)?.area ?? REFERENCE_AREA_HA)
    : REFERENCE_AREA_HA
  return base * getFieldAreaWorkScale(area) * shopMultiplier
}

export const MILL_POSITION = FARM_HUB.mill.position
