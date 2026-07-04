import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import { createAnchorId } from '@/studio/anchor/anchorObject.ts'
import { createBuildingId } from '@/studio/building/buildingObject.ts'
import { sampleBuildingGroundY } from '@/studio/building/buildingSurface.ts'
import {
  allocateMapAttachmentInstanceId,
  allocateMapMachineInstanceId,
} from '@/studio/vehicle/allocatePlacementIds.ts'
import {
  createAttachmentPlacementId,
  createVehicleId,
} from '@/studio/vehicle/vehicleObject.ts'
import { getStudioPlacementEntry } from '@/studio/catalog/StudioPlacementCatalog.ts'
import { getAnchorsForParent } from '@/types/scene-anchor.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'

const DUPLICATE_OFFSET = 4

export function duplicateMapObject(
  map: WorldMapDocument,
  objectId: string,
): { objects: MapObject[]; root: MapObject } | null {
  const source = map.objects.find((object) => object.id === objectId)
  if (!source) {
    return null
  }

  if (source.layer === 'buildings') {
    return duplicateBuilding(map, source)
  }
  if (source.layer === 'vehicles') {
    return duplicateVehicle(map, source)
  }
  if (source.layer === 'poi' && source.kind === 'anchor') {
    return duplicateAnchor(map, source)
  }

  return null
}

function duplicateBuilding(
  map: WorldMapDocument,
  source: MapObject,
): { objects: MapObject[]; root: MapObject } {
  const newId = createBuildingId()
  const x = source.transform.position.x + DUPLICATE_OFFSET
  const z = source.transform.position.z + DUPLICATE_OFFSET
  const y = sampleBuildingGroundY(map, x, z)
  const root: MapObject = {
    ...source,
    id: newId,
    name: `${source.name ?? source.id} Copy`,
    transform: {
      ...source.transform,
      position: { x, y, z },
    },
    properties: {
      ...source.properties,
      anchorIds: [],
    },
  }

  const childAnchors = getAnchorsForParent(map.objects, source.id)
  const clonedAnchors = childAnchors.map((anchor) => {
    const anchorId = createAnchorId()
    return {
      ...anchor,
      id: anchorId,
      transform: {
        ...anchor.transform,
        position: {
          x: anchor.transform.position.x + DUPLICATE_OFFSET,
          y: anchor.transform.position.y,
          z: anchor.transform.position.z + DUPLICATE_OFFSET,
        },
      },
      properties: {
        ...anchor.properties,
        parentObjectId: newId,
      },
    }
  })

  root.properties = {
    ...root.properties,
    anchorIds: clonedAnchors.map((anchor) => anchor.id),
  }

  return { objects: [root, ...clonedAnchors], root }
}

function duplicateVehicle(
  map: WorldMapDocument,
  source: MapObject,
): { objects: MapObject[]; root: MapObject } {
  const props = parseVehiclePlacementProperties(source.properties)
  const placementEntry = props?.placementCatalogId
    ? getStudioPlacementEntry(props.placementCatalogId)
    : undefined

  const newId =
    props?.placementKind === 'attachment'
      ? createAttachmentPlacementId()
      : createVehicleId()

  const x = source.transform.position.x + DUPLICATE_OFFSET
  const z = source.transform.position.z + DUPLICATE_OFFSET
  const y = sampleBuildingGroundY(map, x, z)

  const machineId =
    placementEntry && placementEntry.catalogKind === 'machine'
      ? allocateMapMachineInstanceId(map, placementEntry)
      : props?.machineId

  const attachmentInstanceId =
    placementEntry?.catalogKind === 'attachment' && placementEntry.attachmentCatalogId
      ? allocateMapAttachmentInstanceId(map, placementEntry.attachmentCatalogId)
      : props?.attachmentInstanceId

  const root: MapObject = {
    ...source,
    id: newId,
    name: `${source.name ?? source.id} Copy`,
    transform: {
      ...source.transform,
      position: { x, y, z },
    },
    properties: {
      ...source.properties,
      ...(machineId ? { machineId } : {}),
      ...(attachmentInstanceId ? { attachmentInstanceId } : {}),
      parkingAnchorId: undefined,
    },
  }

  const childAnchors = getAnchorsForParent(map.objects, source.id)
  const clonedAnchors = childAnchors.map((anchor) => {
    const anchorId = createAnchorId()
    return {
      ...anchor,
      id: anchorId,
      transform: {
        ...anchor.transform,
        position: {
          x: anchor.transform.position.x + DUPLICATE_OFFSET,
          y: anchor.transform.position.y,
          z: anchor.transform.position.z + DUPLICATE_OFFSET,
        },
      },
      properties: {
        ...anchor.properties,
        parentObjectId: newId,
        entityId:
          anchor.properties?.entityId === props?.machineId && machineId
            ? machineId
            : anchor.properties?.entityId,
      },
    }
  })

  const parkingAnchor = clonedAnchors.find(
    (anchor) => (anchor.properties as { anchorKind?: string } | undefined)?.anchorKind === 'parking',
  )
  if (parkingAnchor) {
    root.properties = {
      ...root.properties,
      parkingAnchorId: parkingAnchor.id,
    }
  }

  return { objects: [root, ...clonedAnchors], root }
}

function duplicateAnchor(
  _map: WorldMapDocument,
  source: MapObject,
): { objects: MapObject[]; root: MapObject } {
  const anchorId = createAnchorId()
  const root: MapObject = {
    ...source,
    id: anchorId,
    name: `${source.name ?? source.id} Copy`,
    transform: {
      ...source.transform,
      position: {
        x: source.transform.position.x + DUPLICATE_OFFSET,
        y: source.transform.position.y,
        z: source.transform.position.z + DUPLICATE_OFFSET,
      },
    },
  }
  return { objects: [root], root }
}
