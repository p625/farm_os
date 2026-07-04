import type { AbstractMesh, Node, Scene } from '@babylonjs/core'
import { getStudioMetadata } from '@/studio/io/MapSceneBuilder.ts'

export function isBuildingPlacementMesh(mesh: AbstractMesh): boolean {
  const metadata = getStudioMetadata(mesh)
  return metadata?.objectId === 'terrain_ground'
}

export function pickBuildingPlacementPoint(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): { x: number; z: number } | null {
  const pick = scene.pick(canvasX, canvasY, (mesh) =>
    isBuildingPlacementMesh(mesh as AbstractMesh),
  )
  if (!pick?.pickedPoint) {
    return null
  }
  return { x: pick.pickedPoint.x, z: pick.pickedPoint.z }
}

function resolveBuildingMetadata(mesh: AbstractMesh) {
  let current: Node | null = mesh
  while (current) {
    if ('metadata' in current) {
      const metadata = getStudioMetadata(current as AbstractMesh)
      if (metadata?.layer === 'buildings' && metadata.kind !== 'preview') {
        return metadata
      }
    }
    current = current.parent
  }
  return null
}

export function pickBuildingObjectId(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): string | null {
  const pick = scene.pick(canvasX, canvasY, (mesh) => {
    return Boolean(resolveBuildingMetadata(mesh as AbstractMesh))
  })
  if (!pick?.pickedMesh) {
    return null
  }
  return resolveBuildingMetadata(pick.pickedMesh as AbstractMesh)?.objectId ?? null
}
