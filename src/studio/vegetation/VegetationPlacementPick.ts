import type { AbstractMesh, Node, Scene } from '@babylonjs/core'
import {
  getStudioMetadata,
  STUDIO_METADATA_KEY,
} from '@/studio/io/MapSceneBuilder.ts'

export function isVegetationPlacementMesh(mesh: AbstractMesh): boolean {
  const metadata = getStudioMetadata(mesh)
  return metadata?.objectId === 'terrain_ground'
}

export function pickVegetationPlacementPoint(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): { x: number; z: number } | null {
  const pick = scene.pick(canvasX, canvasY, (mesh) =>
    isVegetationPlacementMesh(mesh as AbstractMesh),
  )
  if (!pick?.pickedPoint) {
    return null
  }
  return { x: pick.pickedPoint.x, z: pick.pickedPoint.z }
}

function resolveVegetationMetadata(mesh: AbstractMesh) {
  let current: Node | null = mesh
  while (current) {
    if ('metadata' in current) {
      const metadata = getStudioMetadata(current as AbstractMesh)
      if (metadata?.layer === 'vegetation') {
        return metadata
      }
    }
    current = current.parent
  }
  return null
}

export function pickVegetationObjectId(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): string | null {
  const pick = scene.pick(canvasX, canvasY, (mesh) => {
    return Boolean(resolveVegetationMetadata(mesh as AbstractMesh))
  })
  if (!pick?.pickedMesh) {
    return null
  }
  return resolveVegetationMetadata(pick.pickedMesh as AbstractMesh)?.objectId ?? null
}

export function isVegetationPreviewMesh(mesh: AbstractMesh): boolean {
  const metadata = mesh.metadata?.[STUDIO_METADATA_KEY] as
    | { objectId?: string }
    | undefined
  return metadata?.objectId === '__vegetation_preview__'
}
