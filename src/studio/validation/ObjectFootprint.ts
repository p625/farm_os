import type { MapObject } from '@/types/world-map.ts'
import type { ParcelFootprint } from '@/types/parcel.ts'

export function getBoxObjectFootprint(object: MapObject): ParcelFootprint | null {
  if (object.shape?.type !== 'box') {
    return null
  }
  const { width, depth } = object.shape
  const { x, z } = object.transform.position
  const rotationY = object.transform.rotationY ?? 0
  if (Math.abs(rotationY) > 1e-4) {
    const halfW = width * 0.5
    const halfD = depth * 0.5
    const cos = Math.abs(Math.cos(rotationY))
    const sin = Math.abs(Math.sin(rotationY))
    const extentX = halfW * cos + halfD * sin
    const extentZ = halfW * sin + halfD * cos
    return {
      minX: x - extentX,
      maxX: x + extentX,
      minZ: z - extentZ,
      maxZ: z + extentZ,
      width,
      depth,
      centerX: x,
      centerZ: z,
    }
  }
  const halfW = width * 0.5
  const halfD = depth * 0.5
  return {
    minX: x - halfW,
    maxX: x + halfW,
    minZ: z - halfD,
    maxZ: z + halfD,
    width,
    depth,
    centerX: x,
    centerZ: z,
  }
}
