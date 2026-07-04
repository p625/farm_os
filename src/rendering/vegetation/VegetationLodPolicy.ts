import type { Camera } from '@babylonjs/core'
import type {
  VegetationInstanceTransform,
  VegetationLayerDefinition,
  VegetationLodBand,
} from '@/types/vegetation-rendering.ts'

export function resolveLodBand(
  layer: VegetationLayerDefinition,
  camera: Camera | null,
  worldX: number,
  worldZ: number,
): VegetationLodBand {
  if (!camera) {
    return 'near'
  }

  const cameraPos = camera.globalPosition
  const distance = Math.hypot(cameraPos.x - worldX, cameraPos.z - worldZ)
  const { midDistance, farDistance, cullDistance } = layer.lod

  if (distance >= cullDistance) {
    return 'hidden'
  }
  if (distance >= farDistance) {
    return 'far'
  }
  if (distance >= midDistance) {
    return 'mid'
  }
  return 'near'
}

export function filterInstancesForLod(
  layer: VegetationLayerDefinition,
  instances: readonly VegetationInstanceTransform[],
  camera: Camera | null,
): VegetationInstanceTransform[] {
  const result: VegetationInstanceTransform[] = []

  for (const instance of instances) {
    const band = resolveLodBand(layer, camera, instance.x, instance.z)
    if (band === 'hidden') {
      continue
    }
    if (band === 'far' && Math.random() > layer.lod.farDensityMultiplier) {
      continue
    }
    if (band === 'mid' && Math.random() > layer.lod.midDensityMultiplier) {
      continue
    }
    result.push(instance)
  }

  return result
}

export function shouldCullShortGrassLayer(
  camera: Camera | null,
  cullDistance: number,
): boolean {
  if (!camera) {
    return false
  }
  const pos = camera.globalPosition
  return pos.y > 24 || Math.hypot(pos.x, pos.z) > cullDistance * 0.85
}
