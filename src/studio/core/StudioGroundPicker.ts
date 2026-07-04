import type { Scene } from '@babylonjs/core'
import { Vector3 } from '@babylonjs/core'

/** Raycast from canvas coords onto the horizontal ground plane. */
export function pickGroundPoint(
  scene: Scene,
  canvasX: number,
  canvasY: number,
  groundY = 0,
): Vector3 | null {
  const camera = scene.activeCamera
  if (!camera) {
    return null
  }

  const ray = scene.createPickingRay(canvasX, canvasY, null, camera)
  if (Math.abs(ray.direction.y) < 1e-6) {
    return null
  }

  const t = (groundY - ray.origin.y) / ray.direction.y
  if (t < 0) {
    return null
  }

  return ray.origin.add(ray.direction.scale(t))
}
