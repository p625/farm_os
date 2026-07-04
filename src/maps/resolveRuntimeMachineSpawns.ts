import { getActiveFarmHub } from '@/config/farm-layout.ts'
import { MACHINE_CATALOG } from '@/config/machine-catalog.ts'
import { getGroundedPosition } from '@/maps/grounding.ts'
import { parseSceneAnchorProperties } from '@/types/scene-anchor.ts'
import { MachineId } from '@/types/machine.ts'
import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import {
  parseVehiclePlacementProperties,
  type VehiclePlacementTypeId,
} from '@/types/vehicle-placement.ts'

export interface RuntimeMachineSpawn {
  machineId: MachineId
  position: { x: number; y: number; z: number }
  rotationY: number
}

const DEFAULT_CATALOG_MACHINE_IDS: readonly MachineId[] = MACHINE_CATALOG.map(
  (entry) => entry.id,
)

const VEHICLE_TYPE_TO_MACHINE: Partial<
  Record<VehiclePlacementTypeId, MachineId>
> = {
  tractor: MachineId.Tractor1,
  grain_combine: MachineId.GrainCombine1,
  corn_combine: MachineId.CornCombine1,
}

function spawnFromTransform(object: MapObject): RuntimeMachineSpawn | null {
  const machineId = resolveMachineIdFromMapObject(object)
  if (!machineId) {
    return null
  }

  const grounded = getGroundedPosition(
    object.transform.position.x,
    object.transform.position.z,
  )
  return {
    machineId,
    position: grounded,
    rotationY: object.transform.rotationY ?? 0,
  }
}

function resolveMachineIdFromMapObject(object: MapObject): MachineId | null {
  if (object.layer === 'vehicles') {
    const props = parseVehiclePlacementProperties(object.properties)
    if (!props || props.active === false || props.defaultState === 'disabled') {
      return null
    }
    if (props.placementKind === 'attachment') {
      return null
    }
    if (props.machineId) {
      return resolveMachineIdFromEntity(props.machineId)
    }
    return props.vehicleType
      ? (VEHICLE_TYPE_TO_MACHINE[props.vehicleType] ?? null)
      : null
  }

  if (object.layer === 'poi' && object.kind === 'spawn') {
    const entity = object.properties?.entity
    if (typeof entity === 'string') {
      return resolveMachineIdFromEntity(entity)
    }
  }

  if (object.layer === 'poi' && object.kind === 'anchor') {
    const anchor = parseSceneAnchorProperties(object.properties)
    if (anchor?.anchorKind === 'spawn' || anchor?.anchorKind === 'parking') {
      if (anchor.entityId) {
        return resolveMachineIdFromEntity(anchor.entityId)
      }
    }
  }

  return null
}

export function hasStudioMachinePlacements(worldMap: WorldMapDocument): boolean {
  for (const object of worldMap.objects) {
    if (object.layer !== 'vehicles') {
      continue
    }
    const props = parseVehiclePlacementProperties(object.properties)
    if (!props || props.placementKind === 'attachment') {
      continue
    }
    if (props.machineId || props.placementKind === 'machine') {
      return true
    }
  }
  return false
}

function resolveMachineIdFromEntity(entity: string): MachineId | null {
  for (const entry of MACHINE_CATALOG) {
    if (entity === entry.id || entity === entry.sceneNodeName) {
      return entry.id
    }
  }

  if (entity === 'tractor') {
    return MachineId.Tractor1
  }
  if (entity === 'grain_combine') {
    return MachineId.GrainCombine1
  }
  if (entity === 'corn_combine') {
    return MachineId.CornCombine1
  }

  if (/^tractor_\d+$/.test(entity)) {
    return entity
  }
  if (/^grain_combine_\d+$/.test(entity) || /^corn_combine_\d+$/.test(entity)) {
    return entity
  }

  return null
}

function spawnFromFarmHub(machineId: MachineId): RuntimeMachineSpawn | null {
  const hub = getActiveFarmHub()

  if (machineId === MachineId.Tractor1) {
    const position = getGroundedPosition(
      hub.tractorHome.position.x,
      hub.tractorHome.position.z,
    )
    return {
      machineId,
      position,
      rotationY: hub.tractorHome.rotationY ?? -Math.PI / 6,
    }
  }

  if (machineId === MachineId.GrainCombine1) {
    const position = getGroundedPosition(
      hub.grainCombineHome.position.x,
      hub.grainCombineHome.position.z,
    )
    return {
      machineId,
      position,
      rotationY: hub.grainCombineHome.rotationY ?? -Math.PI / 6,
    }
  }

  if (machineId === MachineId.CornCombine1) {
    const position = getGroundedPosition(
      hub.cornCombineHome.position.x,
      hub.cornCombineHome.position.z,
    )
    return {
      machineId,
      position,
      rotationY: hub.cornCombineHome.rotationY ?? -Math.PI / 6,
    }
  }

  return null
}

/**
 * Resolves gameplay machine spawn positions from Studio map data.
 * Priority: vehicles layer → spawn/parking anchors → exported farm hub layout.
 */
export function resolveRuntimeMachineSpawns(
  worldMap: WorldMapDocument,
): RuntimeMachineSpawn[] {
  const resolved = new Map<MachineId, RuntimeMachineSpawn>()

  for (const object of worldMap.objects) {
    if (object.layer !== 'vehicles') {
      continue
    }
    const spawn = spawnFromTransform(object)
    if (spawn) {
      resolved.set(spawn.machineId, spawn)
    }
  }

  for (const object of worldMap.objects) {
    if (object.layer !== 'poi') {
      continue
    }
    const spawn = spawnFromTransform(object)
    if (spawn && !resolved.has(spawn.machineId)) {
      resolved.set(spawn.machineId, spawn)
    }
  }

  for (const machineId of DEFAULT_CATALOG_MACHINE_IDS) {
    if (resolved.has(machineId)) {
      continue
    }
    if (hasStudioMachinePlacements(worldMap)) {
      continue
    }
    const fallback = spawnFromFarmHub(machineId)
    if (fallback) {
      resolved.set(machineId, fallback)
    }
  }

  return [...resolved.values()]
}

export function getRuntimeMachineSpawn(
  worldMap: WorldMapDocument,
  machineId: MachineId,
): RuntimeMachineSpawn | undefined {
  return resolveRuntimeMachineSpawns(worldMap).find(
    (spawn) => spawn.machineId === machineId,
  )
}
