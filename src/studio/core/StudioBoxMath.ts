import { Vector3 } from '@babylonjs/core'
import type { MapObject } from '@/types/world-map.ts'

export type BoxCorner = 'nw' | 'ne' | 'sw' | 'se'

export const OPPOSITE_BOX_CORNER: Record<BoxCorner, BoxCorner> = {
  nw: 'se',
  ne: 'sw',
  sw: 'ne',
  se: 'nw',
}

const CORNER_SIGNS: Record<BoxCorner, { x: number; z: number }> = {
  nw: { x: -1, z: -1 },
  ne: { x: 1, z: -1 },
  sw: { x: -1, z: 1 },
  se: { x: 1, z: 1 },
}

export const MIN_BOX_FOOTPRINT = 1

export function canResizeObject(object: MapObject): boolean {
  return (
    object.id !== 'terrain_ground' &&
    object.shape?.type === 'box' &&
    object.layer !== 'terrain'
  )
}

export function canMoveObject(object: MapObject): boolean {
  return object.id !== 'terrain_ground'
}

export function getBoxCornerWorld(
  object: MapObject,
  corner: BoxCorner,
): Vector3 | null {
  if (object.shape?.type !== 'box') {
    return null
  }

  const { width, depth } = object.shape
  const { x, y, z } = object.transform.position
  const rotationY = object.transform.rotationY ?? 0
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  const sign = CORNER_SIGNS[corner]
  const localX = sign.x * width * 0.5
  const localZ = sign.z * depth * 0.5

  return new Vector3(
    x + localX * cos - localZ * sin,
    y,
    z + localX * sin + localZ * cos,
  )
}

export function boxFromFixedAndDraggedCorner(
  fixed: Vector3,
  dragged: Vector3,
  rotationY: number,
  heightY: number,
): {
  position: { x: number; y: number; z: number }
  width: number
  depth: number
} {
  if (Math.abs(rotationY) < 1e-6) {
    const width = Math.max(MIN_BOX_FOOTPRINT, Math.abs(dragged.x - fixed.x))
    const depth = Math.max(MIN_BOX_FOOTPRINT, Math.abs(dragged.z - fixed.z))
    return {
      position: {
        x: (fixed.x + dragged.x) * 0.5,
        y: heightY,
        z: (fixed.z + dragged.z) * 0.5,
      },
      width,
      depth,
    }
  }

  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  const dx = dragged.x - fixed.x
  const dz = dragged.z - fixed.z

  return {
    position: {
      x: (fixed.x + dragged.x) * 0.5,
      y: heightY,
      z: (fixed.z + dragged.z) * 0.5,
    },
    width: Math.max(MIN_BOX_FOOTPRINT, Math.abs(dx * cos + dz * sin)),
    depth: Math.max(MIN_BOX_FOOTPRINT, Math.abs(-dx * sin + dz * cos)),
  }
}
