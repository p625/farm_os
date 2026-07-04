import type { MapObject } from '@/types/world-map.ts'
import type { AssetAnchorTemplate } from '@/types/asset-definition.ts'
import {
  resolveAnchorEntityId,
  resolveAnchorLocalOffset,
} from '@/types/asset-definition.ts'
import type { BuildingTypeId } from '@/types/building.ts'
import { getBuildingCatalogEntry } from '@/config/building-catalog.ts'
import { getPlacementAnchorTemplates } from '@/config/gameplay-asset-catalog.ts'
import type { StudioPlacementEntry } from '@/studio/catalog/StudioPlacementCatalog.ts'

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
  anchorKind: import('@/types/scene-anchor.ts').SceneAnchorKind
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
  const properties = {
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
    properties,
  }
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

export function createAnchorsFromTemplates(
  parent: MapObject,
  templates: readonly AssetAnchorTemplate[],
  surfaceY: number,
  parentWidth: number,
  parentDepth: number,
  context: { machineId?: string; buildingId?: string } = {},
): MapObject[] {
  const rotationY = parent.transform.rotationY ?? 0
  return templates.map((template) => {
    const { localX, localZ } = resolveAnchorLocalOffset(
      template,
      parentWidth,
      parentDepth,
    )
    const offset = rotateOffset(localX, localZ, rotationY)
    const entityId = resolveAnchorEntityId(template, context)
    return createSceneAnchorObject(
      parent.transform.position.x + offset.x,
      parent.transform.position.z + offset.z,
      {
        anchorKind: template.anchorKind,
        label: template.label,
        surfaceY,
        parentObjectId: parent.id,
        entityId,
        triggerRadius: template.triggerRadius,
        rotationY,
      },
    )
  })
}

export function createDefaultBuildingAnchors(
  building: MapObject,
  buildingType: BuildingTypeId,
  surfaceY: number,
): MapObject[] {
  const entry = getBuildingCatalogEntry(buildingType)
  return createAnchorsFromTemplates(
    building,
    entry.defaultAnchors,
    surfaceY,
    entry.width,
    entry.depth,
    { buildingId: building.id },
  )
}

export function createDefaultPlacementAnchors(
  placement: MapObject,
  entry: StudioPlacementEntry,
  surfaceY: number,
  machineId?: string,
): MapObject[] {
  const templates = getPlacementAnchorTemplates(entry.catalogKind, entry.catalogId)
  return createAnchorsFromTemplates(
    placement,
    templates,
    surfaceY,
    entry.width,
    entry.depth,
    { machineId },
  )
}

/** @deprecated Use createDefaultPlacementAnchors */
export function createDefaultVehicleAnchors(
  vehicle: MapObject,
  surfaceY: number,
  machineId?: string,
): MapObject[] {
  const width =
    vehicle.shape?.type === 'box' ? vehicle.shape.width : 2.5
  const depth =
    vehicle.shape?.type === 'box' ? vehicle.shape.depth : 4
  const templates = machineId
    ? getPlacementAnchorTemplates('machine', machineId)
    : getPlacementAnchorTemplates('attachment', 'wagon')
  return createAnchorsFromTemplates(
    vehicle,
    templates,
    surfaceY,
    width,
    depth,
    { machineId },
  )
}

export type { AssetAnchorTemplate as DefaultAnchorSpec }
