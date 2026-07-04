import { tryGetActiveMapContext } from '@/maps/MapRuntimeContext.ts'
import { getFieldCatalog, FIELD_CATALOG } from '@/config/field-catalog.ts'
import {
  FARM_HUB,
  FIELD_LAYOUT,
  MAP_01_WORLD_BOUNDS,
  type FarmHubLayout,
  type FieldLayoutEntry,
  type WorldBounds,
} from '@/config/map-01-layout.ts'

export {
  FARM_HUB,
  FIELD_LAYOUT,
  MAP_01_WORLD_BOUNDS,
  getWorldCenter,
  getWorldTerrainSize,
} from '@/config/map-01-layout.ts'

export function getActiveFarmHub(): FarmHubLayout {
  return tryGetActiveMapContext()?.farmHub ?? FARM_HUB
}

export function getActiveFieldLayout(): readonly FieldLayoutEntry[] {
  return tryGetActiveMapContext()?.fieldLayout ?? FIELD_LAYOUT
}

export function getActiveWorldBounds(): WorldBounds {
  return tryGetActiveMapContext()?.worldBounds ?? MAP_01_WORLD_BOUNDS
}

export function getActiveWorldTerrainSize(): { width: number; depth: number } {
  const bounds = getActiveWorldBounds()
  return {
    width: bounds.maxX - bounds.minX,
    depth: bounds.maxZ - bounds.minZ,
  }
}

export function getActiveWorldCenter(): { x: number; z: number } {
  const bounds = getActiveWorldBounds()
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    z: (bounds.minZ + bounds.maxZ) / 2,
  }
}

export function getFieldLayoutEntry(id: string): FieldLayoutEntry | undefined {
  return getActiveFieldLayout().find((entry) => entry.id === id)
}

export function getFieldHalfExtents(id: string): {
  halfWidth: number
  halfDepth: number
} {
  const layout = getFieldLayoutEntry(id)
  if (!layout) {
    return { halfWidth: 5, halfDepth: 7 }
  }
  return {
    halfWidth: layout.meshSize.width / 2,
    halfDepth: layout.meshSize.depth / 2,
  }
}

export function getFieldPositions(): Record<string, { x: number; y: number; z: number }> {
  return Object.fromEntries(
    getActiveFieldLayout().map((entry) => [entry.id, { ...entry.position }]),
  )
}

export function getFieldDefinitions(): Array<{ id: string; name: string }> {
  return getFieldCatalog().map(({ id, name }) => ({ id, name }))
}

export function getTractorHome(): { x: number; y: number; z: number } {
  return { ...getActiveFarmHub().tractorHome.position }
}

export function getTractorHomeRotationY(): number {
  return getActiveFarmHub().tractorHome.rotationY ?? -Math.PI / 6
}

export function getGrainCombineHome(): { x: number; y: number; z: number } {
  return { ...getActiveFarmHub().grainCombineHome.position }
}

export function getCornCombineHome(): { x: number; y: number; z: number } {
  return { ...getActiveFarmHub().cornCombineHome.position }
}

export function getGrainCombineHomeRotationY(): number {
  return getActiveFarmHub().grainCombineHome.rotationY ?? -Math.PI / 6
}

export function getCornCombineHomeRotationY(): number {
  return getActiveFarmHub().cornCombineHome.rotationY ?? -Math.PI / 6
}

export function getEquipmentYardSpawnPositions(): Record<
  string,
  { x: number; y: number; z: number }
> {
  return { ...getActiveFarmHub().equipmentYard }
}

export function getMillPosition(): { x: number; y: number; z: number } {
  return { ...getActiveFarmHub().mill.position }
}

/** @deprecated Use getTractorHome() */
export const TRACTOR_HOME = FARM_HUB.tractorHome.position
/** @deprecated Use getTractorHomeRotationY() */
export const TRACTOR_HOME_ROTATION_Y =
  FARM_HUB.tractorHome.rotationY ?? -Math.PI / 6

/** @deprecated Use getGrainCombineHome() */
export const GRAIN_COMBINE_HOME = FARM_HUB.grainCombineHome.position
/** @deprecated Use getCornCombineHome() */
export const CORN_COMBINE_HOME = FARM_HUB.cornCombineHome.position

/** @deprecated Use getGrainCombineHomeRotationY() */
export const GRAIN_COMBINE_HOME_ROTATION_Y =
  FARM_HUB.grainCombineHome.rotationY ?? -Math.PI / 6
/** @deprecated Use getCornCombineHomeRotationY() */
export const CORN_COMBINE_HOME_ROTATION_Y =
  FARM_HUB.cornCombineHome.rotationY ?? -Math.PI / 6

/** @deprecated Use getEquipmentYardSpawnPositions() */
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

export {
  MACHINE_MOVE_SPEED_SIM as TRACTOR_MOVE_SPEED,
  LOGISTICS_ARRIVAL_THRESHOLD,
  getFieldAreaWorkScale,
  getScaledFieldWorkDurationSimSeconds as getScaledFieldWorkDuration,
} from '@/config/time-balance.ts'

/** @deprecated Use getFieldDefinitions() */
export const FIELD_DEFINITIONS_STATIC = FIELD_DEFINITIONS

/** @deprecated Use getFieldPositions() */
export const FIELD_POSITIONS: Record<string, { x: number; y: number; z: number }> =
  Object.fromEntries(FIELD_LAYOUT.map((entry) => [entry.id, { ...entry.position }]))

/** @deprecated Use getMillPosition() */
export const MILL_POSITION = FARM_HUB.mill.position
