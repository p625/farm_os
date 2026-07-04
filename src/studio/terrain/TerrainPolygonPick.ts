import type { Scene } from '@babylonjs/core'
import type { AbstractMesh } from '@babylonjs/core'
import { getStudioMetadata } from '@/studio/io/MapSceneBuilder.ts'
import { TERRAIN_POLYGON_KIND } from '@/types/terrain-polygon.ts'

export function pickTerrainPlacementPoint(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): { x: number; z: number } | null {
  const pick = scene.pick(canvasX, canvasY, (mesh) => {
    const metadata = getStudioMetadata(mesh as AbstractMesh)
    return (
      metadata?.objectId === 'terrain_ground' ||
      metadata?.kind === TERRAIN_POLYGON_KIND
    )
  })
  if (!pick?.pickedPoint) {
    return null
  }
  return { x: pick.pickedPoint.x, z: pick.pickedPoint.z }
}

export function pickTerrainPolygonObjectId(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): string | null {
  const pick = scene.pick(canvasX, canvasY, (mesh) => {
    const metadata = getStudioMetadata(mesh as AbstractMesh)
    return metadata?.kind === TERRAIN_POLYGON_KIND
  })
  const metadata = pick?.pickedMesh
    ? getStudioMetadata(pick.pickedMesh as AbstractMesh)
    : null
  return metadata?.objectId ?? null
}
