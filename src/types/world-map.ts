/** FarmOS Studio — world map document schema (v1). */

export const WORLD_MAP_FORMAT_VERSION = 1

export const STUDIO_LAYER_IDS = [
  'terrain',
  'roads',
  'fields',
  'vegetation',
  'buildings',
  'water',
  'poi',
  'debug',
] as const

export type StudioLayerId = (typeof STUDIO_LAYER_IDS)[number]

export interface MapVec3 {
  x: number
  y: number
  z: number
}

export interface MapBoxShape {
  type: 'box'
  width: number
  height: number
  depth: number
}

export interface MapObjectTransform {
  position: MapVec3
  rotationY?: number
  scale?: MapVec3
}

export interface MapObject {
  id: string
  layer: StudioLayerId
  kind: string
  name?: string
  transform: MapObjectTransform
  shape?: MapBoxShape
  properties?: Record<string, unknown>
}

export interface WorldMapTerrain {
  width: number
  height: number
}

export interface WorldMapMeta {
  author?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface WorldMapDocument {
  formatVersion: typeof WORLD_MAP_FORMAT_VERSION
  id: string
  name: string
  meta: WorldMapMeta
  terrain: WorldMapTerrain
  objects: MapObject[]
}

export interface StudioLogEntry {
  id: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  timestamp: string
}

export function isStudioLayerId(value: string): value is StudioLayerId {
  return (STUDIO_LAYER_IDS as readonly string[]).includes(value)
}
