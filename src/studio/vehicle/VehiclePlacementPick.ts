import type { AbstractMesh, Scene } from '@babylonjs/core'
import { pickBuildingPlacementPoint } from '@/studio/building/BuildingPlacementPick.ts'
import { getStudioMetadata } from '@/studio/io/MapSceneBuilder.ts'

export function pickVehiclePlacementPoint(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): { x: number; z: number } | null {
  return pickBuildingPlacementPoint(scene, canvasX, canvasY)
}

export function pickVehicleObjectId(
  scene: Scene,
  canvasX: number,
  canvasY: number,
): string | null {
  const pick = scene.pick(canvasX, canvasY, (mesh: AbstractMesh) => {
    const metadata = getStudioMetadata(mesh)
    return metadata?.layer === 'vehicles'
  })
  if (!pick?.hit) {
    return null
  }
  const metadata = getStudioMetadata(pick.pickedMesh as AbstractMesh)
  return metadata?.objectId ?? null
}
