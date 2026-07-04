import type { FieldBlockId } from '@/config/map-01-layout.ts'
import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { FieldParcelProperties } from '@/types/parcel.ts'
import {
  footprintFromRect,
  parcelRectFromCorners,
  type ParcelRect,
} from '@/studio/parcel/ParcelMath.ts'

const FIELD_SURFACE_THICKNESS = 0.08
const FIELD_SURFACE_LIFT = 0.04

let parcelCounter = 0

export function createFieldParcelId(): string {
  parcelCounter += 1
  return `field_${parcelCounter}`
}

export function resetFieldParcelIdCounter(next: number): void {
  parcelCounter = next
}

export function syncFieldParcelIdCounterFromMap(map: WorldMapDocument): void {
  let max = 0
  for (const object of map.objects) {
    if (object.layer !== 'fields') {
      continue
    }
    const match = /^field_(\d+)$/.exec(object.id)
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10))
    }
  }
  parcelCounter = max
}

export function getFieldParcels(map: WorldMapDocument): MapObject[] {
  return map.objects.filter(
    (object) => object.layer === 'fields' && object.kind === 'field',
  )
}

export interface CreateFieldParcelOptions {
  parcelBlock: FieldBlockId
  fertility: number
  surfaceY: number
  name?: string
}

export function createFieldParcelFromRect(
  rect: ParcelRect,
  options: CreateFieldParcelOptions,
): MapObject {
  const id = createFieldParcelId()
  const properties: FieldParcelProperties = {
    parcelBlock: options.parcelBlock,
    fertility: options.fertility,
  }
  return {
    id,
    layer: 'fields',
    kind: 'field',
    name: options.name ?? `Pole ${id.replace('field_', '')}`,
    transform: {
      position: {
        x: rect.centerX,
        y: options.surfaceY,
        z: rect.centerZ,
      },
    },
    shape: {
      type: 'box',
      width: rect.width,
      height: FIELD_SURFACE_THICKNESS,
      depth: rect.depth,
    },
    properties: { ...properties },
  }
}

export function createFieldParcelFromCorners(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  surfaceY: number,
  options: Omit<CreateFieldParcelOptions, 'surfaceY'>,
): MapObject {
  const rect = parcelRectFromCorners(ax, az, bx, bz)
  return createFieldParcelFromRect(rect, { ...options, surfaceY })
}

export function fieldParcelSurfaceY(sampledTerrainY: number): number {
  return sampledTerrainY + FIELD_SURFACE_LIFT
}

export { FIELD_SURFACE_THICKNESS, FIELD_SURFACE_LIFT }

export function parcelRectToFootprint(rect: ParcelRect) {
  return footprintFromRect(rect)
}
