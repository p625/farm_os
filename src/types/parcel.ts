import type { FieldBlockId } from '@/config/map-01-layout.ts'
import type { MapObject, MapShape } from '@/types/world-map.ts'
import {
  parseFieldTestState,
  serializeFieldTestState,
  FieldWorkState,
  type FieldTestState,
} from '@/types/field-test-state.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import {
  getFieldPolygonPoints,
  polygonBoundingFootprint,
} from '@/studio/parcel/ParcelPolygon.ts'

export type { FieldTestState } from '@/types/field-test-state.ts'
export {
  DEFAULT_FIELD_TEST_STATE,
  FIELD_TEST_PRESETS,
  parseFieldTestState,
  serializeFieldTestState,
} from '@/types/field-test-state.ts'

export const PARCEL_BLOCK_IDS = ['A', 'B', 'C', 'M'] as const

export type ParcelBlockId = (typeof PARCEL_BLOCK_IDS)[number]

export const PARCEL_TYPES = [
  'arable',
  'meadow',
  'pasture',
  'protected',
] as const

export type ParcelType = (typeof PARCEL_TYPES)[number]

export const OWNERSHIP_STAGES = [
  'start',
  'development',
  'advanced',
  'goal',
] as const

export type OwnershipStage = (typeof OWNERSHIP_STAGES)[number]

export function isParcelBlockId(value: unknown): value is ParcelBlockId {
  return typeof value === 'string' && (PARCEL_BLOCK_IDS as readonly string[]).includes(value)
}

export function isParcelType(value: unknown): value is ParcelType {
  return typeof value === 'string' && (PARCEL_TYPES as readonly string[]).includes(value)
}

export function isOwnershipStage(value: unknown): value is OwnershipStage {
  return (
    typeof value === 'string' &&
    (OWNERSHIP_STAGES as readonly string[]).includes(value)
  )
}

/** @deprecated Use isParcelBlockId — game economy blocks are still A/B/C only. */
export function isFieldBlockId(value: unknown): value is FieldBlockId {
  return value === 'A' || value === 'B' || value === 'C'
}

export interface FieldParcelProperties {
  parcelBlock: ParcelBlockId
  fertility: number
  parcelId?: string
  parcelType?: ParcelType
  ownershipStage?: OwnershipStage
  catalogId?: string
  roadAccess?: string
  fieldTestState?: FieldTestState
}

export interface ParcelFootprint {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  width: number
  depth: number
  centerX: number
  centerZ: number
}

export function defaultParcelTypeForBlock(block: ParcelBlockId): ParcelType {
  return block === 'M' ? 'meadow' : 'arable'
}

export function defaultFieldTestStateForParcelType(
  parcelType: ParcelType,
): FieldTestState {
  if (parcelType === 'meadow' || parcelType === 'pasture') {
    return {
      cropEnabled: false,
      cropId: null,
      lifecycleState: States.Grass,
      growthPercent: 0,
      workState: FieldWorkState.Idle,
    }
  }
  return {
    cropEnabled: false,
    cropId: null,
    lifecycleState: States.Plowed,
    growthPercent: 0,
    workState: FieldWorkState.NeedsSeeding,
  }
}

export function parseFieldParcelProperties(
  properties: Record<string, unknown> | undefined,
): FieldParcelProperties | null {
  if (!properties || !isParcelBlockId(properties.parcelBlock)) {
    return null
  }
  const fertility =
    typeof properties.fertility === 'number' ? properties.fertility : 75
  const catalogId =
    typeof properties.catalogId === 'string' ? properties.catalogId : undefined
  const roadAccess =
    typeof properties.roadAccess === 'string' ? properties.roadAccess : undefined
  const parcelId =
    typeof properties.parcelId === 'string' ? properties.parcelId : undefined
  const parcelType = isParcelType(properties.parcelType)
    ? properties.parcelType
    : defaultParcelTypeForBlock(properties.parcelBlock)
  const ownershipStage = isOwnershipStage(properties.ownershipStage)
    ? properties.ownershipStage
    : 'start'
  const fieldTestState = parseFieldTestState(properties)
  return {
    parcelBlock: properties.parcelBlock,
    fertility,
    parcelType,
    ownershipStage,
    fieldTestState,
    ...(catalogId ? { catalogId } : {}),
    ...(parcelId ? { parcelId } : {}),
    ...(roadAccess ? { roadAccess } : {}),
  }
}

export function patchFieldParcelProperties(
  properties: Record<string, unknown>,
  patch: {
    parcelBlock?: ParcelBlockId
    fertility?: number
    parcelId?: string
    parcelType?: ParcelType
    ownershipStage?: OwnershipStage
    roadAccess?: string
    fieldTestState?: FieldTestState
  },
): Record<string, unknown> {
  const next = { ...properties }
  if (patch.parcelBlock !== undefined) {
    next.parcelBlock = patch.parcelBlock
  }
  if (patch.fertility !== undefined) {
    next.fertility = Math.max(0, Math.min(100, patch.fertility))
  }
  if (patch.parcelId !== undefined) {
    next.parcelId = patch.parcelId
  }
  if (patch.parcelType !== undefined) {
    next.parcelType = patch.parcelType
  }
  if (patch.ownershipStage !== undefined) {
    next.ownershipStage = patch.ownershipStage
  }
  if (patch.roadAccess !== undefined) {
    next.roadAccess = patch.roadAccess
  }
  if (patch.fieldTestState !== undefined) {
    next.fieldTestState = serializeFieldTestState(patch.fieldTestState)
  }
  return next
}

export function getFieldParcelFootprint(object: MapObject): ParcelFootprint | null {
  const polygonPoints = getFieldPolygonPoints(object)
  if (polygonPoints && polygonPoints.length >= 3) {
    return polygonBoundingFootprint(polygonPoints)
  }

  if (object.layer !== 'fields' || object.shape?.type !== 'box') {
    return null
  }
  const { width, depth } = object.shape
  const { x, z } = object.transform.position
  const rotationY = object.transform.rotationY ?? 0
  if (Math.abs(rotationY) > 1e-4) {
    const halfW = width * 0.5
    const halfD = depth * 0.5
    const cos = Math.abs(Math.cos(rotationY))
    const sin = Math.abs(Math.sin(rotationY))
    const extentX = halfW * cos + halfD * sin
    const extentZ = halfW * sin + halfD * cos
    return {
      minX: x - extentX,
      maxX: x + extentX,
      minZ: z - extentZ,
      maxZ: z + extentZ,
      width,
      depth,
      centerX: x,
      centerZ: z,
    }
  }
  const halfW = width * 0.5
  const halfD = depth * 0.5
  return {
    minX: x - halfW,
    maxX: x + halfW,
    minZ: z - halfD,
    maxZ: z + halfD,
    width,
    depth,
    centerX: x,
    centerZ: z,
  }
}

export function getFieldShapeDimensions(shape: MapShape | undefined): {
  width: number
  depth: number
} | null {
  if (!shape) {
    return null
  }
  if (shape.type === 'box') {
    return { width: shape.width, depth: shape.depth }
  }
  const footprint = polygonBoundingFootprint(shape.points)
  return { width: footprint.width, depth: footprint.depth }
}

export function isArableParcelType(parcelType: ParcelType | undefined): boolean {
  return parcelType === 'arable'
}

export function isMeadowLikeParcelType(parcelType: ParcelType | undefined): boolean {
  return parcelType === 'meadow' || parcelType === 'pasture' || parcelType === 'protected'
}
