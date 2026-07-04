import type { AbstractMesh } from '@babylonjs/core'
import { getFieldIds } from '@/config/field-catalog.ts'
import { getStudioMetadata } from '@/studio/io/MapSceneBuilder.ts'

export function resolveFieldIdFromMesh(mesh: AbstractMesh): string | null {
  let current: AbstractMesh | null = mesh
  while (current) {
    const studioMeta = getStudioMetadata(current)
    if (
      studioMeta?.layer === 'fields' &&
      (getFieldIds() as readonly string[]).includes(studioMeta.objectId)
    ) {
      return studioMeta.objectId
    }

    if ((getFieldIds() as readonly string[]).includes(current.name)) {
      return current.name
    }

    current = current.parent as AbstractMesh | null
  }

  return null
}
