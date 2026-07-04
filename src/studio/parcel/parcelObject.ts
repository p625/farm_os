import type { ParcelBlockId, ParcelType } from '@/types/parcel.ts'
import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { MapPolygonPoint } from '@/types/world-map.ts'
import {
  defaultFieldTestStateForParcelType,
  defaultParcelTypeForBlock,
  type FieldParcelProperties,
} from '@/types/parcel.ts'
import {
  createPolygonShape,
  polygonCentroid,
  rectToPolygonPoints,
} from '@/studio/parcel/ParcelPolygon.ts'
import {
  footprintFromRect,
  parcelRectFromCorners,
  type ParcelRect,
} from '@/studio/parcel/ParcelMath.ts'
import { allocateParcelLayoutId } from '@/studio/parcel/allocateParcelLayoutId.ts'
export const FIELD_SURFACE_THICKNESS = 0.08
export const FIELD_SURFACE_LIFT = 0.04

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
  parcelBlock: ParcelBlockId
  fertility: number
  surfaceY: number
  name?: string
  parcelId?: string
  parcelType?: ParcelType
}

export function createFieldParcelFromPolygon(
  points: readonly MapPolygonPoint[],
  map: WorldMapDocument,
  options: CreateFieldParcelOptions,
): MapObject {
  const id = createFieldParcelId()
  const parcelType = options.parcelType ?? defaultParcelTypeForBlock(options.parcelBlock)
  const parcelId =
    options.parcelId ?? allocateParcelLayoutId(map, options.parcelBlock)
  const centroid = polygonCentroid(points)
  const properties: FieldParcelProperties = {
    parcelBlock: options.parcelBlock,
    fertility: options.fertility,
    parcelId,
    parcelType,
    ownershipStage: 'start',
    fieldTestState: defaultFieldTestStateForParcelType(parcelType),
  }
  return {
    id,
    layer: 'fields',
    kind: 'field',
    name: options.name ?? `Parcel ${parcelId}`,
    transform: {
      position: {
        x: centroid.x,
        y: options.surfaceY,
        z: centroid.z,
      },
    },
    shape: createPolygonShape(points, FIELD_SURFACE_THICKNESS),
    properties: { ...properties },
  }
}

export function createFieldParcelFromRect(
  rect: ParcelRect,
  map: WorldMapDocument,
  options: CreateFieldParcelOptions,
): MapObject {
  return createFieldParcelFromPolygon(
    rectToPolygonPoints(rect),
    map,
    options,
  )
}

export function createFieldParcelFromCorners(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  surfaceY: number,
  map: WorldMapDocument,
  options: Omit<CreateFieldParcelOptions, 'surfaceY'>,
): MapObject {
  const rect = parcelRectFromCorners(ax, az, bx, bz)
  return createFieldParcelFromRect(rect, map, { ...options, surfaceY })
}

export function fieldParcelSurfaceY(sampledTerrainY: number): number {
  return sampledTerrainY + FIELD_SURFACE_LIFT
}

export function parcelRectToFootprint(rect: ParcelRect) {
  return footprintFromRect(rect)
}
