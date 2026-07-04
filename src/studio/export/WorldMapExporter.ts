import { FieldOwnership } from '@/types/ownership.ts'
import type { FieldBlockId, FarmHubLayout } from '@/config/map-01-layout.ts'
import { FARM_HUB } from '@/config/map-01-layout.ts'
import type { FieldCatalogEntry, FieldDevelopmentTier } from '@/config/field-catalog.ts'
import type { MapPackageData } from '@/types/map-package.ts'
import { MAP_PACKAGE_FORMAT_VERSION } from '@/types/map-package.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import { parseFieldParcelProperties } from '@/types/parcel.ts'
import { parseBuildingProperties } from '@/types/building.ts'
import type { BuildingTypeId } from '@/types/building.ts'
import { getTerrainBounds, getTerrainGroundObject } from '@/studio/validation/terrainBounds.ts'
import { buildFarmHubFromAnchors } from '@/studio/anchor/anchorHubExport.ts'
import { DEFAULT_CAMERA_PROFILE_ID } from '@/config/camera-profiles.ts'

export interface StoredMapPackage {
  packageData: MapPackageData
  worldMap: WorldMapDocument
}

export interface ExportPackageOptions {
  packageId?: string
  packageName?: string
  description?: string
}

export function suggestStudioPackageId(map: WorldMapDocument): string {
  if (map.id === 'map_01' || map.id === 'map_01_central_europe') {
    return 'map_01_studio'
  }
  if (map.id.endsWith('_studio')) {
    return map.id
  }
  return `${map.id}_studio`
}

function resolveGameFieldBlockId(parcelBlock: string | undefined): FieldBlockId {
  if (parcelBlock === 'B' || parcelBlock === 'C') {
    return parcelBlock
  }
  return 'A'
}

function tierForBlock(blockId: FieldBlockId): FieldDevelopmentTier {
  if (blockId === 'A') {
    return 'starter'
  }
  if (blockId === 'B') {
    return 'mid'
  }
  return 'late'
}

function defaultPrices(blockId: FieldBlockId, area: number): {
  purchasePrice: number
  leasePrice: number
} {
  const base = blockId === 'A' ? 400 : blockId === 'B' ? 900 : 1500
  return {
    purchasePrice: Math.round(base * area * 10),
    leasePrice: Math.round(base * area * 1.5),
  }
}

function estimateAreaHa(width: number, depth: number): number {
  return Math.max(1, Math.round((width * depth) / 100))
}

function hubPlacementFromObject(
  map: WorldMapDocument,
  objectId: string,
): { position: { x: number; y: number; z: number }; rotationY?: number } | null {
  const object = map.objects.find((entry) => entry.id === objectId)
  if (!object) {
    return null
  }
  return {
    position: { ...object.transform.position },
    ...(object.transform.rotationY !== undefined
      ? { rotationY: object.transform.rotationY }
      : {}),
  }
}

function hubPlacementFromBuildingType(
  map: WorldMapDocument,
  buildingType: BuildingTypeId,
): { position: { x: number; y: number; z: number }; rotationY?: number } | null {
  const object = map.objects.find((entry) => {
    if (entry.layer !== 'buildings') {
      return false
    }
    return parseBuildingProperties(entry.properties)?.buildingType === buildingType
  })
  if (!object) {
    return null
  }
  return {
    position: { ...object.transform.position },
    ...(object.transform.rotationY !== undefined
      ? { rotationY: object.transform.rotationY }
      : {}),
  }
}

function extractFarmHub(map: WorldMapDocument): FarmHubLayout {
  const farmyardObject = map.objects.find((entry) => entry.id === 'building_farmyard')
  const farmyardPosition = farmyardObject?.transform.position
  const farmyardShape = farmyardObject?.shape

  const hub: FarmHubLayout = {
    farmyard: {
      position: farmyardPosition
        ? { ...farmyardPosition }
        : { ...FARM_HUB.farmyard.position },
      size:
        farmyardShape?.type === 'box'
          ? { width: farmyardShape.width, depth: farmyardShape.depth }
          : { ...FARM_HUB.farmyard.size },
    },
    barn:
      hubPlacementFromObject(map, 'building_barn') ??
      hubPlacementFromBuildingType(map, 'farm_barn') ?? { ...FARM_HUB.barn },
    mill:
      hubPlacementFromObject(map, 'building_mill') ??
      hubPlacementFromBuildingType(map, 'farm_mill') ?? { ...FARM_HUB.mill },
    dealership:
      hubPlacementFromObject(map, 'building_dealership') ??
      hubPlacementFromBuildingType(map, 'shop_general') ?? { ...FARM_HUB.dealership },
    tractorHome:
      hubPlacementFromObject(map, 'poi_tractor_spawn') ??
      hubPlacementFromObject(map, 'building_tractor_home') ?? {
        ...FARM_HUB.tractorHome,
      },
    grainCombineHome: { ...FARM_HUB.grainCombineHome },
    cornCombineHome: { ...FARM_HUB.cornCombineHome },
    siloEntry: { ...FARM_HUB.siloEntry },
    dealerEntry: { ...FARM_HUB.dealerEntry },
    equipmentYard: { ...FARM_HUB.equipmentYard },
    deliverySlots: FARM_HUB.deliverySlots.map((slot) => ({ ...slot })),
  }

  const fromAnchors = buildFarmHubFromAnchors(map)
  return {
    ...hub,
    ...(fromAnchors.tractorHome ? { tractorHome: fromAnchors.tractorHome } : {}),
    ...(fromAnchors.grainCombineHome
      ? { grainCombineHome: fromAnchors.grainCombineHome }
      : {}),
    ...(fromAnchors.cornCombineHome ? { cornCombineHome: fromAnchors.cornCombineHome } : {}),
    ...(fromAnchors.siloEntry ? { siloEntry: fromAnchors.siloEntry } : {}),
    ...(fromAnchors.dealerEntry ? { dealerEntry: fromAnchors.dealerEntry } : {}),
    ...(fromAnchors.equipmentYard
      ? { equipmentYard: { ...hub.equipmentYard, ...fromAnchors.equipmentYard } }
      : {}),
    ...(fromAnchors.deliverySlots
      ? { deliverySlots: fromAnchors.deliverySlots }
      : {}),
  }
}

function buildCameraProfiles(hub: FarmHubLayout, worldCenter: { x: number; z: number }) {
  return [
    {
      id: DEFAULT_CAMERA_PROFILE_ID,
      label: 'Overview',
      alpha: -Math.PI / 4,
      beta: 1.05,
      radius: 72,
      targetOffset: {
        x: (hub.barn.position.x + worldCenter.x) / 2,
        y: 0,
        z: (hub.barn.position.z + worldCenter.z) / 2,
      },
    },
  ]
}

export function exportWorldMapToPackage(
  map: WorldMapDocument,
  options?: ExportPackageOptions,
): StoredMapPackage {
  const bounds = getTerrainBounds(map)
  if (!bounds) {
    throw new Error('Export requires terrain_ground with a box shape.')
  }

  const ground = getTerrainGroundObject(map)!
  const terrainWidth = ground.shape!.width
  const terrainDepth = ground.shape!.depth
  const worldCenter = {
    x: (bounds.minX + bounds.maxX) / 2,
    z: (bounds.minZ + bounds.maxZ) / 2,
  }

  const fieldObjects = map.objects.filter(
    (object) =>
      object.layer === 'fields' &&
      object.kind === 'field' &&
      object.shape?.type === 'box',
  )

  const fieldLayout = fieldObjects.map((field) => {
    const props = parseFieldParcelProperties(field.properties)
    const blockId = resolveGameFieldBlockId(props?.parcelBlock)
    return {
      id: field.id,
      position: {
        x: field.transform.position.x,
        y: 0,
        z: field.transform.position.z,
      },
      meshSize: {
        width: field.shape!.width,
        depth: field.shape!.depth,
      },
      ...(field.transform.rotationY !== undefined
        ? { rotationY: field.transform.rotationY }
        : {}),
      blockId,
      ...(props?.roadAccess ? { roadAccess: props.roadAccess } : {}),
    }
  })

  const fields: FieldCatalogEntry[] = fieldObjects.map((field, index) => {
    const props = parseFieldParcelProperties(field.properties)
    const blockId = resolveGameFieldBlockId(props?.parcelBlock)
    const width = field.shape!.width
    const depth = field.shape!.depth
    const area = estimateAreaHa(width, depth)
    const fertility = props?.fertility ?? 75
    const prices = defaultPrices(blockId, area)
    const owned =
      index === 0 && blockId === 'A'
        ? FieldOwnership.Owned
        : FieldOwnership.Available

    return {
      id: field.id,
      name: field.name ?? `Pole ${field.id.replace('field_', '')}`,
      purchasePrice: prices.purchasePrice,
      leasePrice: prices.leasePrice,
      area,
      fertility,
      initialOwnership: owned,
      blockId,
      developmentTier: tierForBlock(blockId),
    }
  })

  const farmHub = extractFarmHub(map)
  const blockIds = [...new Set(fields.map((field) => field.blockId))]

  const packageId = options?.packageId?.trim() || suggestStudioPackageId(map)
  const packageName = options?.packageName?.trim() || map.name
  const description =
    options?.description?.trim() ||
    map.meta.description ||
    'Exported from FarmOS Studio'

  const packageData: MapPackageData = {
    manifest: {
      packageFormatVersion: MAP_PACKAGE_FORMAT_VERSION,
      id: packageId,
      name: packageName,
      version: '1.0.0',
      author: map.meta.author ?? 'FarmOS Studio',
      description,
      source: 'community',
      fieldCount: fields.length,
      blockIds,
      createdAt: map.meta.createdAt,
      updatedAt: new Date().toISOString(),
    },
    layout: {
      worldBounds: bounds,
      terrain: { width: terrainWidth, depth: terrainDepth },
      farmHub,
      fieldLayout,
    },
    fields,
    cameraProfiles: buildCameraProfiles(farmHub, worldCenter),
  }

  return {
    packageData,
    worldMap: {
      ...map,
      meta: {
        ...map.meta,
        updatedAt: new Date().toISOString(),
      },
    },
  }
}
