import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { VegetationTypeId } from '@/types/vegetation.ts'
import {
  getVegetationTypeDefinition,
  type VegetationTypeDefinition,
} from '@/studio/vegetation/VegetationTypePalette.ts'

let vegetationCounter = 0

export function createVegetationId(): string {
  vegetationCounter += 1
  return `veg_${vegetationCounter}`
}

export function resetVegetationIdCounter(next: number): void {
  vegetationCounter = next
}

export function syncVegetationIdCounterFromMap(map: WorldMapDocument): void {
  let max = 0
  for (const object of map.objects) {
    if (object.layer !== 'vegetation') {
      continue
    }
    const match = /^veg_(\d+)$/.exec(object.id)
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10))
    }
  }
  vegetationCounter = max
}

export function getVegetationObjects(map: WorldMapDocument): MapObject[] {
  return map.objects.filter((object) => object.layer === 'vegetation')
}

export function getVegetationTypeFromObject(
  object: MapObject,
): VegetationTypeId | null {
  const raw = object.properties?.vegetationType
  return typeof raw === 'string' ? (raw as VegetationTypeId) : null
}

export interface CreateVegetationOptions {
  vegetationType: VegetationTypeId
  surfaceY: number
  rotationY?: number
  name?: string
}

export function createVegetationObject(
  worldX: number,
  worldZ: number,
  options: CreateVegetationOptions,
): MapObject {
  const definition = getVegetationTypeDefinition(options.vegetationType)
  const id = createVegetationId()
  return buildVegetationMapObject(id, worldX, worldZ, definition, options)
}

export function buildVegetationMapObject(
  id: string,
  worldX: number,
  worldZ: number,
  definition: VegetationTypeDefinition,
  options: Omit<CreateVegetationOptions, 'vegetationType'>,
): MapObject {
  return {
    id,
    layer: 'vegetation',
    kind: definition.kind,
    name: options.name ?? definition.label,
    transform: {
      position: { x: worldX, y: options.surfaceY, z: worldZ },
      rotationY: options.rotationY ?? Math.random() * Math.PI * 2,
    },
    properties: {
      vegetationType: definition.id,
      heightClass: definition.heightClass,
      spreadClass: definition.spreadClass,
    },
  }
}
