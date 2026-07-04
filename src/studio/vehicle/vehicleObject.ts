import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import {
  getStudioPlacementEntry,
  type StudioPlacementEntry,
} from '@/studio/catalog/StudioPlacementCatalog.ts'
import type { VehiclePlacementTypeId } from '@/types/vehicle-placement.ts'
import {
  getVehicleTypeDefinition,
  type VehicleTypeDefinition,
} from '@/studio/vehicle/VehicleTypePalette.ts'

let vehicleCounter = 0
let attachmentPlacementCounter = 0

export function createVehicleId(): string {
  vehicleCounter += 1
  return `veh_${vehicleCounter}`
}

export function createAttachmentPlacementId(): string {
  attachmentPlacementCounter += 1
  return `att_place_${attachmentPlacementCounter}`
}

export function resetVehicleIdCounter(next: number): void {
  vehicleCounter = next
}

export function resetAttachmentPlacementIdCounter(next: number): void {
  attachmentPlacementCounter = next
}

export function syncVehicleIdCounterFromMap(map: WorldMapDocument): void {
  let maxVehicle = 0
  let maxAttachment = 0
  for (const object of map.objects) {
    if (object.layer !== 'vehicles') {
      continue
    }
    const vehicleMatch = /^veh_(\d+)$/.exec(object.id)
    if (vehicleMatch) {
      maxVehicle = Math.max(maxVehicle, Number.parseInt(vehicleMatch[1], 10))
    }
    const attachmentMatch = /^att_place_(\d+)$/.exec(object.id)
    if (attachmentMatch) {
      maxAttachment = Math.max(
        maxAttachment,
        Number.parseInt(attachmentMatch[1], 10),
      )
    }
  }
  vehicleCounter = maxVehicle
  attachmentPlacementCounter = maxAttachment
}

export interface CreateVehicleOptions {
  vehicleType?: VehiclePlacementTypeId
  placementEntry?: StudioPlacementEntry
  surfaceY: number
  rotationY?: number
  name?: string
  hostBuildingId?: string
  machineId?: string
  attachmentInstanceId?: string
}

function legacyVehicleTypeFromEntry(
  entry: StudioPlacementEntry,
): VehiclePlacementTypeId {
  if (entry.catalogKind === 'attachment') {
    if (entry.category === 'trailer') {
      return 'trailer'
    }
    if (entry.category === 'header') {
      return 'implement'
    }
    return 'implement'
  }
  if (entry.catalogId.includes('grain_combine')) {
    return 'grain_combine'
  }
  if (entry.catalogId.includes('corn_combine')) {
    return 'corn_combine'
  }
  return 'tractor'
}

export function createVehiclePlacementObject(
  worldX: number,
  worldZ: number,
  options: CreateVehicleOptions,
): MapObject {
  if (options.placementEntry) {
    return buildCatalogPlacementObject(
      worldX,
      worldZ,
      options.placementEntry,
      options,
    )
  }

  if (!options.vehicleType) {
    throw new Error('createVehiclePlacementObject requires vehicleType or placementEntry')
  }

  const definition = getVehicleTypeDefinition(options.vehicleType)
  const id = createVehicleId()
  return buildVehicleMapObject(id, worldX, worldZ, definition, options)
}

function buildCatalogPlacementObject(
  worldX: number,
  worldZ: number,
  entry: StudioPlacementEntry,
  options: CreateVehicleOptions,
): MapObject {
  const id =
    entry.catalogKind === 'attachment'
      ? createAttachmentPlacementId()
      : createVehicleId()
  const legacyType = legacyVehicleTypeFromEntry(entry)

  return {
    id,
    layer: 'vehicles',
    kind: legacyType,
    name: options.name ?? entry.name,
    transform: {
      position: { x: worldX, y: options.surfaceY, z: worldZ },
      rotationY: options.rotationY ?? 0,
    },
    shape: {
      type: 'box',
      width: entry.width,
      height: entry.height,
      depth: entry.depth,
    },
    properties: {
      vehicleType: legacyType,
      placementCatalogId: entry.id,
      placementKind: entry.catalogKind,
      defaultState: 'parked',
      active: true,
      ...(entry.catalogKind === 'machine'
        ? { machineId: options.machineId ?? entry.machineId }
        : {}),
      ...(entry.catalogKind === 'attachment'
        ? {
            attachmentCatalogId: entry.attachmentCatalogId,
            attachmentInstanceId: options.attachmentInstanceId,
          }
        : {}),
      ...(options.hostBuildingId ? { hostBuildingId: options.hostBuildingId } : {}),
    },
  }
}

export function buildVehicleMapObject(
  id: string,
  worldX: number,
  worldZ: number,
  definition: VehicleTypeDefinition,
  options: Omit<CreateVehicleOptions, 'vehicleType' | 'placementEntry'>,
): MapObject {
  return {
    id,
    layer: 'vehicles',
    kind: definition.id,
    name: options.name ?? definition.label,
    transform: {
      position: { x: worldX, y: options.surfaceY, z: worldZ },
      rotationY: options.rotationY ?? 0,
    },
    shape: {
      type: 'box',
      width: definition.width,
      height: definition.height,
      depth: definition.depth,
    },
    properties: {
      vehicleType: definition.id,
      defaultState: 'parked',
      active: true,
      ...(definition.defaultMachineId
        ? { machineId: options.machineId ?? definition.defaultMachineId }
        : {}),
      ...(options.hostBuildingId ? { hostBuildingId: options.hostBuildingId } : {}),
    },
  }
}

export function resolvePlacementEntryFromProperties(
  properties: Record<string, unknown> | undefined,
): StudioPlacementEntry | undefined {
  if (typeof properties?.placementCatalogId !== 'string') {
    return undefined
  }
  return getStudioPlacementEntry(properties.placementCatalogId)
}
