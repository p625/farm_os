import type { ParcelFootprint } from '@/types/parcel.ts'

export const MIN_PARCEL_FOOTPRINT = 4

export interface ParcelRect {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  width: number
  depth: number
  centerX: number
  centerZ: number
}

export function parcelRectFromCorners(
  ax: number,
  az: number,
  bx: number,
  bz: number,
): ParcelRect {
  const minX = Math.min(ax, bx)
  const maxX = Math.max(ax, bx)
  const minZ = Math.min(az, bz)
  const maxZ = Math.max(az, bz)
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    centerX: (minX + maxX) * 0.5,
    centerZ: (minZ + maxZ) * 0.5,
  }
}

export function footprintFromRect(rect: ParcelRect): ParcelFootprint {
  return {
    minX: rect.centerX - rect.width * 0.5,
    maxX: rect.centerX + rect.width * 0.5,
    minZ: rect.centerZ - rect.depth * 0.5,
    maxZ: rect.centerZ + rect.depth * 0.5,
    width: rect.width,
    depth: rect.depth,
    centerX: rect.centerX,
    centerZ: rect.centerZ,
  }
}

export function footprintsOverlap(a: ParcelFootprint, b: ParcelFootprint): boolean {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  )
}
