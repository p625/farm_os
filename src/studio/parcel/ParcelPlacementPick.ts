import type { Scene } from '@babylonjs/core'
import type { AbstractMesh } from '@babylonjs/core'
import { getStudioMetadata } from '@/studio/io/MapSceneBuilder.ts'

export function isParcelPlacementMesh(mesh: AbstractMesh): boolean {
  const metadata = getStudioMetadata(mesh)
  return metadata?.objectId === 'terrain_ground'
}

export function pickParcelPlacementPoint(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): { x: number; z: number } | null {
  const pick = scene.pick(canvasX, canvasY, (mesh) =>
    isParcelPlacementMesh(mesh as AbstractMesh),
  )
  if (!pick?.pickedPoint) {
    return null
  }
  return { x: pick.pickedPoint.x, z: pick.pickedPoint.z }
}

export function pickFieldObjectId(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): string | null {
  const pick = scene.pick(canvasX, canvasY, (mesh) => {
    const metadata = getStudioMetadata(mesh as AbstractMesh)
    return metadata?.layer === 'fields' && metadata.kind === 'field'
  })
  const metadata = pick?.pickedMesh
    ? getStudioMetadata(pick.pickedMesh as AbstractMesh)
    : null
  return metadata?.objectId ?? null
}
