import type { MapObject } from '@/types/world-map.ts'
import { getAnchorsForParent } from '@/types/scene-anchor.ts'

export function isSceneAnchorObject(object: MapObject): boolean {
  return object.layer === 'poi' && object.kind === 'anchor'
}

export function isGameplayParentObject(object: MapObject): boolean {
  return object.layer === 'buildings' || object.layer === 'vehicles'
}

export function shouldSyncAnchorsWithParent(object: MapObject): boolean {
  return isGameplayParentObject(object)
}

export function translateObjectsWithAnchors(
  objects: readonly MapObject[],
  parentId: string,
  deltaX: number,
  deltaZ: number,
): MapObject[] {
  if (Math.abs(deltaX) < 1e-9 && Math.abs(deltaZ) < 1e-9) {
    return [...objects]
  }

  return objects.map((object) => {
    if (object.id === parentId) {
      return {
        ...object,
        transform: {
          ...object.transform,
          position: {
            ...object.transform.position,
            x: object.transform.position.x + deltaX,
            z: object.transform.position.z + deltaZ,
          },
        },
      }
    }

    if (
      isSceneAnchorObject(object) &&
      object.properties?.parentObjectId === parentId
    ) {
      return {
        ...object,
        transform: {
          ...object.transform,
          position: {
            ...object.transform.position,
            x: object.transform.position.x + deltaX,
            z: object.transform.position.z + deltaZ,
          },
        },
      }
    }

    return object
  })
}

export function rotateObjectsWithAnchors(
  objects: readonly MapObject[],
  parentId: string,
  nextRotationY: number,
): MapObject[] {
  const parent = objects.find((object) => object.id === parentId)
  if (!parent) {
    return [...objects]
  }

  const previousRotationY = parent.transform.rotationY ?? 0
  const deltaRotation = nextRotationY - previousRotationY
  if (Math.abs(deltaRotation) < 1e-9) {
    return [...objects]
  }

  const pivotX = parent.transform.position.x
  const pivotZ = parent.transform.position.z
  const cos = Math.cos(deltaRotation)
  const sin = Math.sin(deltaRotation)

  return objects.map((object) => {
    if (object.id === parentId) {
      return {
        ...object,
        transform: {
          ...object.transform,
          rotationY: nextRotationY,
        },
      }
    }

    if (
      isSceneAnchorObject(object) &&
      object.properties?.parentObjectId === parentId
    ) {
      const offsetX = object.transform.position.x - pivotX
      const offsetZ = object.transform.position.z - pivotZ
      return {
        ...object,
        transform: {
          ...object.transform,
          position: {
            ...object.transform.position,
            x: pivotX + offsetX * cos - offsetZ * sin,
            z: pivotZ + offsetX * sin + offsetZ * cos,
          },
          rotationY: (object.transform.rotationY ?? 0) + deltaRotation,
        },
      }
    }

    return object
  })
}

export function replaceObjects(
  objects: readonly MapObject[],
  replacements: readonly MapObject[],
): MapObject[] {
  const byId = new Map(replacements.map((object) => [object.id, object]))
  return objects.map((object) => byId.get(object.id) ?? object)
}

export function collectAnchorIdsForParent(
  objects: readonly MapObject[],
  parentId: string,
): string[] {
  return getAnchorsForParent(objects, parentId).map((anchor) => anchor.id)
}
