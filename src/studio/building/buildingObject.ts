import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { BuildingTypeId } from '@/types/building.ts'
import {
  getBuildingTotalHeight,
  getBuildingTypeDefinition,
  type BuildingTypeDefinition,
} from '@/studio/building/BuildingTypePalette.ts'

let buildingCounter = 0

export function createBuildingId(): string {
  buildingCounter += 1
  return `bld_${buildingCounter}`
}

export function resetBuildingIdCounter(next: number): void {
  buildingCounter = next
}

export function syncBuildingIdCounterFromMap(map: WorldMapDocument): void {
  let max = 0
  for (const object of map.objects) {
    if (object.layer !== 'buildings') {
      continue
    }
    const match = /^bld_(\d+)$/.exec(object.id)
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10))
    }
  }
  buildingCounter = max
}

export interface CreateBuildingOptions {
  buildingType: BuildingTypeId
  surfaceY: number
  rotationY?: number
  name?: string
}

export function createBuildingObject(
  worldX: number,
  worldZ: number,
  options: CreateBuildingOptions,
): MapObject {
  const definition = getBuildingTypeDefinition(options.buildingType)
  const id = createBuildingId()
  return buildBuildingMapObject(id, worldX, worldZ, definition, options)
}

export function buildBuildingMapObject(
  id: string,
  worldX: number,
  worldZ: number,
  definition: BuildingTypeDefinition,
  options: Omit<CreateBuildingOptions, 'buildingType'>,
): MapObject {
  const totalHeight = getBuildingTotalHeight(definition)
  return {
    id,
    layer: 'buildings',
    kind: definition.id,
    name: options.name ?? definition.label,
    transform: {
      position: { x: worldX, y: options.surfaceY, z: worldZ },
      rotationY: options.rotationY ?? 0,
    },
    shape: {
      type: 'box',
      width: definition.width,
      height: totalHeight,
      depth: definition.depth,
    },
    properties: {
      buildingType: definition.id,
      category: definition.category,
      owner: 'farm',
      active: true,
      anchorIds: [],
    },
  }
}
