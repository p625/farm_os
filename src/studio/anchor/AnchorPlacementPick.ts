import type { AbstractMesh, Scene } from '@babylonjs/core'
import { getStudioMetadata } from '@/studio/io/MapSceneBuilder.ts'

export function pickAnchorObjectId(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): string | null {
  const pick = scene.pick(canvasX, canvasY, (mesh: AbstractMesh) => {
    const metadata = getStudioMetadata(mesh)
    return metadata?.layer === 'poi' && metadata.kind === 'anchor'
  })
  if (!pick?.hit) {
    return null
  }
  const metadata = getStudioMetadata(pick.pickedMesh as AbstractMesh)
  return metadata?.objectId ?? null
}
