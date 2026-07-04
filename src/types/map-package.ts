import type { FieldBlockId } from '@/config/map-01-layout.ts'
import type { FieldOwnership } from '@/types/ownership.ts'
import type { FieldDevelopmentTier } from '@/config/field-catalog.ts'

export const MAP_PACKAGE_FORMAT_VERSION = 1

export type MapPackageSource = 'official' | 'community'

export interface MapPackageManifest {
  packageFormatVersion: typeof MAP_PACKAGE_FORMAT_VERSION
  id: string
  name: string
  version: string
  author?: string
  description?: string
  preview?: string
  source: MapPackageSource
  difficulty?: string
  recommendedPlayers?: number
  requiredVersion?: string
  fieldCount?: number
  blockIds?: FieldBlockId[]
  /** Relative path to `.farmos-map.json` beside package.json (official blockout maps). */
  worldMapFile?: string
  createdAt?: string
  updatedAt?: string
}

export interface MapFieldCatalogEntry {
  id: string
  name: string
  purchasePrice: number
  leasePrice: number
  area: number
  fertility: number
  initialOwnership: FieldOwnership
  blockId: FieldBlockId
  developmentTier: FieldDevelopmentTier
}

export interface MapFieldLayoutEntry {
  id: string
  position: { x: number; y: number; z: number }
  meshSize: { width: number; depth: number }
  rotationY?: number
  blockId: FieldBlockId
  roadAccess?: string
  preferredMachineApproach?: string
}

export interface MapHubPlacement {
  position: { x: number; y: number; z: number }
  rotationY?: number
}

export interface MapFarmHubLayout {
  farmyard: {
    position: { x: number; y: number; z: number }
    size: { width: number; depth: number }
  }
  barn: MapHubPlacement
  mill: MapHubPlacement
  dealership: MapHubPlacement
  tractorHome: MapHubPlacement
  grainCombineHome: MapHubPlacement
  cornCombineHome: MapHubPlacement
  siloEntry: MapHubPlacement
  dealerEntry: MapHubPlacement
  equipmentYard: Record<string, { x: number; y: number; z: number }>
  deliverySlots: Array<{ x: number; y: number; z: number; rotationY: number }>
}

export interface MapLayoutData {
  worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number }
  terrain: { width: number; depth: number }
  farmHub: MapFarmHubLayout
  fieldLayout: MapFieldLayoutEntry[]
}

export interface MapCameraProfile {
  id: string
  label: string
  alpha: number
  beta: number
  radius: number
  targetOffset: { x: number; y: number; z: number }
}

export interface MapPackageData {
  manifest: MapPackageManifest
  layout: MapLayoutData
  fields: MapFieldCatalogEntry[]
  cameraProfiles: MapCameraProfile[]
}

export interface MapPackageSummary {
  id: string
  name: string
  description?: string
  version: string
  author?: string
  preview?: string
  source: MapPackageSource
  fieldCount: number
  blockIds: FieldBlockId[]
}
