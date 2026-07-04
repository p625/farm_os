import type { MapObject } from '@/types/world-map.ts'
import type { RoadKind } from '@/types/road.ts'
import type { BuildingTypeId } from '@/types/building.ts'
import type { VegetationTypeId } from '@/types/vegetation.ts'
import type { WaterTypeId } from '@/types/water.ts'
import type { FieldBlockId } from '@/config/map-01-layout.ts'

export interface Map01Metadata {
  id: string
  name: string
  description: string
  variant: 'A'
  sizeMeters: { width: number; depth: number }
  sourceDocuments: string[]
  author: string
  createdAt: string
}

export interface Map01TerrainData {
  width: number
  height: number
  resolution: number
  origin: { x: number; z: number }
  profile: 'variant_a_hillside_valley'
}

export interface Map01FieldParcel {
  id: string
  name: string
  parcelId: string
  parcelBlock: FieldBlockId | 'M'
  center: { x: number; z: number }
  size: { width: number; depth: number }
  rotationY?: number
  fertility: number
  roadAccess?: string
  kind: 'field' | 'meadow'
}

export interface Map01RoadSegment {
  id: string
  name: string
  roadKind: RoadKind
  category:
    | 'primary'
    | 'secondary'
    | 'farm'
    | 'field_access'
    | 'forest'
    | 'service'
    | 'scenic'
  points: Array<{ x: number; z: number }>
}

export interface Map01BuildingPlacement {
  id: string
  name: string
  buildingType: BuildingTypeId
  position: { x: number; z: number }
  rotationY?: number
}

export interface Map01WaterBody {
  id: string
  name: string
  waterType: WaterTypeId
  placementKind: 'spline' | 'area'
  points?: Array<{ x: number; z: number }>
  center?: { x: number; z: number }
  radiusX?: number
  radiusZ?: number
}

export interface Map01VegetationZone {
  id: string
  name: string
  vegetationType: VegetationTypeId
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
  densityPerSqM: number
  seed: number
  category: 'forest' | 'hedgerow' | 'alley' | 'solitary'
}

export interface Map01Poi {
  id: string
  name: string
  kind: string
  position: { x: number; z: number }
  properties?: Record<string, unknown>
}

export interface Map01BlockoutData {
  metadata: Map01Metadata
  terrain: Map01TerrainData
  fields: Map01FieldParcel[]
  roads: Map01RoadSegment[]
  buildings: Map01BuildingPlacement[]
  water: Map01WaterBody[]
  vegetation: Map01VegetationZone[]
  poi: Map01Poi[]
}

export type Map01AssembledObjects = MapObject[]
