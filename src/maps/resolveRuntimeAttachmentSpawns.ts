import { getAttachmentCatalogEntry } from '@/config/attachment-catalog.ts'
import { getGroundedPosition } from '@/maps/grounding.ts'
import type { AttachmentCatalogIdValue } from '@/types/attachment.ts'
import type { AttachmentIdValue } from '@/types/attachment.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'

export interface RuntimeAttachmentSpawn {
  attachmentInstanceId: AttachmentIdValue
  catalogId: AttachmentCatalogIdValue
  position: { x: number; y: number; z: number }
  rotationY: number
}

export function resolveRuntimeAttachmentSpawns(
  worldMap: WorldMapDocument,
): RuntimeAttachmentSpawn[] {
  const spawns: RuntimeAttachmentSpawn[] = []

  for (const object of worldMap.objects) {
    if (object.layer !== 'vehicles') {
      continue
    }
    const props = parseVehiclePlacementProperties(object.properties)
    if (
      !props ||
      props.placementKind !== 'attachment' ||
      !props.attachmentCatalogId
    ) {
      continue
    }
    const catalog = getAttachmentCatalogEntry(props.attachmentCatalogId)
    if (!catalog) {
      continue
    }
    const instanceId = (props.attachmentInstanceId ??
      `${props.attachmentCatalogId}_1`) as AttachmentIdValue
    const grounded = getGroundedPosition(
      object.transform.position.x,
      object.transform.position.z,
    )
    spawns.push({
      attachmentInstanceId: instanceId,
      catalogId: props.attachmentCatalogId,
      position: grounded,
      rotationY: object.transform.rotationY ?? 0,
    })
  }

  return spawns
}

export function getRuntimeAttachmentSpawn(
  worldMap: WorldMapDocument,
  attachmentInstanceId: string,
): RuntimeAttachmentSpawn | undefined {
  return resolveRuntimeAttachmentSpawns(worldMap).find(
    (spawn) => spawn.attachmentInstanceId === attachmentInstanceId,
  )
}
