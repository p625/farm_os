import type { MapObject } from '@/types/world-map.ts'
import type { SceneAnchorKind, SceneAnchorProperties } from '@/types/scene-anchor.ts'
import type { BuildingTypeId } from '@/types/building.ts'
import { getBuildingTypeDefinition } from '@/studio/building/BuildingTypePalette.ts'

let anchorCounter = 0

export function createAnchorId(): string {
  anchorCounter += 1
  return `anc_${anchorCounter}`
}

export function resetAnchorIdCounter(next: number): void {
  anchorCounter = next
}

export function syncAnchorIdCounterFromMap(objects: readonly MapObject[]): void {
  let max = 0
  for (const object of objects) {
    if (object.layer !== 'poi' || object.kind !== 'anchor') {
      continue
    }
    const match = /^anc_(\d+)$/.exec(object.id)
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10))
    }
  }
  anchorCounter = max
}

export interface CreateAnchorOptions {
  anchorKind: SceneAnchorKind
  label: string
  surfaceY: number
  parentObjectId?: string
  entityId?: string
  triggerRadius?: number
  rotationY?: number
}

export function createSceneAnchorObject(
  worldX: number,
  worldZ: number,
  options: CreateAnchorOptions,
): MapObject {
  const id = createAnchorId()
  const properties: SceneAnchorProperties = {
    anchorKind: options.anchorKind,
    label: options.label,
    active: true,
    ...(options.parentObjectId ? { parentObjectId: options.parentObjectId } : {}),
    ...(options.entityId ? { entityId: options.entityId } : {}),
    ...(options.triggerRadius !== undefined
      ? { triggerRadius: options.triggerRadius }
      : {}),
  }
  return {
    id,
    layer: 'poi',
    kind: 'anchor',
    name: options.label,
    transform: {
      position: { x: worldX, y: options.surfaceY, z: worldZ },
      ...(options.rotationY !== undefined ? { rotationY: options.rotationY } : {}),
    },
    properties: { ...properties },
  }
}

export interface DefaultAnchorSpec {
  anchorKind: SceneAnchorKind
  label: string
  localX: number
  localZ: number
  entityId?: string
  triggerRadius?: number
}

function rotateOffset(
  localX: number,
  localZ: number,
  rotationY: number,
): { x: number; z: number } {
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  return {
    x: localX * cos - localZ * sin,
    z: localX * sin + localZ * cos,
  }
}

export function createDefaultBuildingAnchors(
  building: MapObject,
  buildingType: BuildingTypeId,
  surfaceY: number,
): MapObject[] {
  const definition = getBuildingTypeDefinition(buildingType)
  const rotationY = building.transform.rotationY ?? 0
  const specs = defaultAnchorSpecsForBuilding(buildingType, definition.width, definition.depth)

  return specs.map((spec) => {
    const offset = rotateOffset(spec.localX, spec.localZ, rotationY)
    return createSceneAnchorObject(
      building.transform.position.x + offset.x,
      building.transform.position.z + offset.z,
      {
        anchorKind: spec.anchorKind,
        label: spec.label,
        surfaceY,
        parentObjectId: building.id,
        entityId: spec.entityId,
        triggerRadius: spec.triggerRadius,
        rotationY,
      },
    )
  })
}

function defaultAnchorSpecsForBuilding(
  buildingType: BuildingTypeId,
  width: number,
  depth: number,
): DefaultAnchorSpec[] {
  const frontZ = depth * 0.55
  const specs: DefaultAnchorSpec[] = [
    {
      anchorKind: 'entry',
      label: 'Main Entrance',
      localX: 0,
      localZ: frontZ,
    },
  ]

  if (buildingType === 'farm_barn' || buildingType === 'farm_shed') {
    specs.push({
      anchorKind: 'entry',
      label: 'Vehicle Entrance',
      localX: width * 0.35,
      localZ: frontZ,
    })
    specs.push({
      anchorKind: 'loading',
      label: 'Loading Area',
      localX: -width * 0.25,
      localZ: depth * 0.2,
      triggerRadius: 4,
    })
  }

  if (buildingType === 'farm_silo') {
    specs.push({
      anchorKind: 'interaction',
      label: 'Silo Entry',
      localX: 0,
      localZ: frontZ,
      entityId: 'silo_entry',
    })
    specs.push({
      anchorKind: 'unload',
      label: 'Unload Point',
      localX: width * 0.4,
      localZ: 0,
      triggerRadius: 5,
    })
  }

  if (buildingType === 'shop_general') {
    specs.push({
      anchorKind: 'interaction',
      label: 'Shop Entry',
      localX: 0,
      localZ: frontZ,
      entityId: 'dealer_entry',
    })
    specs.push({
      anchorKind: 'parking',
      label: 'Customer Parking',
      localX: width * 0.6,
      localZ: frontZ * 0.5,
    })
  }

  if (buildingType === 'farm_mill') {
    specs.push({
      anchorKind: 'service',
      label: 'Service Entrance',
      localX: -width * 0.3,
      localZ: frontZ * 0.6,
    })
  }

  if (buildingType.startsWith('civic_')) {
    specs.push({
      anchorKind: 'entry',
      label: 'Side Entrance',
      localX: width * 0.4,
      localZ: 0,
    })
  }

  return specs
}

export function createDefaultVehicleAnchors(
  vehicle: MapObject,
  surfaceY: number,
): MapObject[] {
  const rotationY = vehicle.transform.rotationY ?? 0
  const offset = rotateOffset(0, 2.5, rotationY)
  return [
    createSceneAnchorObject(
      vehicle.transform.position.x + offset.x,
      vehicle.transform.position.z + offset.z,
      {
        anchorKind: 'parking',
        label: 'Parking Spot',
        surfaceY,
        parentObjectId: vehicle.id,
        entityId: 'vehicle_parking',
      },
    ),
    createSceneAnchorObject(
      vehicle.transform.position.x,
      vehicle.transform.position.z,
      {
        anchorKind: 'spawn',
        label: 'Vehicle Spawn',
        surfaceY,
        parentObjectId: vehicle.id,
      },
    ),
  ]
}
