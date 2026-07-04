import type { MapObject } from '@/types/world-map.ts'

/** Unified scene anchor kinds — buildings, vehicles, POI, triggers. */
export const SCENE_ANCHOR_KINDS = [
  'entry',
  'exit',
  'parking',
  'loading',
  'unload',
  'service',
  'interaction',
  'spawn',
  'trigger',
] as const

export type SceneAnchorKind = (typeof SCENE_ANCHOR_KINDS)[number]

export function isSceneAnchorKind(value: unknown): value is SceneAnchorKind {
  return (
    typeof value === 'string' &&
    (SCENE_ANCHOR_KINDS as readonly string[]).includes(value)
  )
}

export interface SceneAnchorProperties {
  anchorKind: SceneAnchorKind
  /** Human label, e.g. Main Entrance, Garage Door */
  label: string
  /** Parent building or vehicle MapObject.id */
  parentObjectId?: string
  /** Game entity binding — machine id, interaction id, etc. */
  entityId?: string
  /** Optional trigger radius in meters */
  triggerRadius?: number
  active?: boolean
}

export function parseSceneAnchorProperties(
  properties: Record<string, unknown> | undefined,
): SceneAnchorProperties | null {
  if (!properties || !isSceneAnchorKind(properties.anchorKind)) {
    return null
  }
  const label = typeof properties.label === 'string' ? properties.label : 'Anchor'
  const parentObjectId =
    typeof properties.parentObjectId === 'string'
      ? properties.parentObjectId
      : undefined
  const entityId =
    typeof properties.entityId === 'string' ? properties.entityId : undefined
  const triggerRadius =
    typeof properties.triggerRadius === 'number' ? properties.triggerRadius : undefined
  const active = properties.active !== false
  return {
    anchorKind: properties.anchorKind,
    label,
    ...(parentObjectId ? { parentObjectId } : {}),
    ...(entityId ? { entityId } : {}),
    ...(triggerRadius !== undefined ? { triggerRadius } : {}),
    active,
  }
}

export function isSceneAnchorObject(object: MapObject): boolean {
  return object.layer === 'poi' && object.kind === 'anchor'
}

export function getSceneAnchors(objects: readonly MapObject[]): MapObject[] {
  return objects.filter(isSceneAnchorObject)
}

export function getAnchorsForParent(
  objects: readonly MapObject[],
  parentObjectId: string,
): MapObject[] {
  return getSceneAnchors(objects).filter(
    (object) =>
      parseSceneAnchorProperties(object.properties)?.parentObjectId ===
      parentObjectId,
  )
}
