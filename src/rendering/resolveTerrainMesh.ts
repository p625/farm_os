import type { AbstractMesh } from '@babylonjs/core'
import { getStudioMetadata } from '@/studio/io/MapSceneBuilder.ts'

const LEGACY_TERRAIN_MESH_NAME = 'terrain'
const STUDIO_TERRAIN_MESH_NAME = 'studio_terrain_ground'

export function isTerrainMesh(mesh: AbstractMesh): boolean {
  let current: AbstractMesh | null = mesh
  while (current) {
    if (
      current.name === LEGACY_TERRAIN_MESH_NAME ||
      current.name === STUDIO_TERRAIN_MESH_NAME
    ) {
      return true
    }

    const metadata = getStudioMetadata(current)
    if (
      metadata?.layer === 'terrain' &&
      metadata.objectId === 'terrain_ground'
    ) {
      return true
    }

    current = current.parent as AbstractMesh | null
  }

  return false
}

export function terrainMeshPickPredicate(mesh: AbstractMesh): boolean {
  return isTerrainMesh(mesh)
}
