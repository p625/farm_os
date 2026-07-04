import { BUILDING_CATALOG } from '@/config/building-catalog.ts'
import { MACHINE_CATALOG } from '@/config/machine-catalog.ts'
import { ATTACHMENT_CATALOG } from '@/config/attachment-catalog.ts'
import {
  getAllGameplayAssetDefinitions,
  getRequiredAnchorTemplates,
} from '@/config/gameplay-asset-catalog.ts'
import { getStudioPlacementCatalog } from '@/studio/catalog/StudioPlacementCatalog.ts'
import type { AssetAnchorTemplate } from '@/types/asset-definition.ts'
import { SCENE_ANCHOR_KINDS } from '@/types/scene-anchor.ts'
import { WORLD_MAP_FORMAT_VERSION } from '@/types/world-map.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { createBuildingObject } from '@/studio/building/buildingObject.ts'
import {
  createDefaultBuildingAnchors,
  createDefaultPlacementAnchors,
} from '@/studio/anchor/anchorObject.ts'
import { createVehiclePlacementObject } from '@/studio/vehicle/vehicleObject.ts'
import {
  allocateMapAttachmentInstanceId,
  allocateMapMachineInstanceId,
} from '@/studio/vehicle/allocatePlacementIds.ts'
import type { BuildingTypeId } from '@/types/building.ts'
import { getSceneAnchors, parseSceneAnchorProperties } from '@/types/scene-anchor.ts'
import { parseBuildingProperties } from '@/types/building.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'
import { getPlacementAnchorTemplates, getBuildingAnchorTemplates } from '@/config/gameplay-asset-catalog.ts'
import { MachineId } from '@/types/machine.ts'
import { AttachmentCatalogId } from '@/types/attachment.ts'

export interface CatalogCoverageReport {
  buildingCount: number
  machineCount: number
  attachmentCount: number
  studioPlacementCount: number
  placementEntityCount: number
  passed: boolean
  failures: string[]
}

function anchorIdentity(template: AssetAnchorTemplate): string {
  return `${template.anchorKind}|${template.entityId ?? ''}|${template.label}`
}

function validateAnchorTemplate(
  template: AssetAnchorTemplate,
  assetLabel: string,
  index: number,
): string[] {
  const failures: string[] = []
  const prefix = `${assetLabel} anchor[${index}]`

  if (!SCENE_ANCHOR_KINDS.includes(template.anchorKind)) {
    failures.push(`${prefix}: invalid anchorKind "${template.anchorKind}"`)
  }
  if (!template.label.trim()) {
    failures.push(`${prefix}: missing label`)
  }
  if (!Number.isFinite(template.localX) || !Number.isFinite(template.localZ)) {
    failures.push(`${prefix}: localX/localZ must be finite numbers`)
  }
  return failures
}

function validateAnchorTemplates(
  assetId: string,
  category: string,
  templates: readonly AssetAnchorTemplate[],
): string[] {
  const failures: string[] = []
  const label = `${category} "${assetId}"`

  if (templates.length === 0) {
    failures.push(`${label}: defaultAnchors must not be empty`)
    return failures
  }

  const seen = new Set<string>()
  for (const [index, template] of templates.entries()) {
    failures.push(...validateAnchorTemplate(template, label, index))
    const key = anchorIdentity(template)
    if (seen.has(key)) {
      failures.push(`${label}: duplicate anchor identity "${key}"`)
    }
    seen.add(key)
  }

  return failures
}

function collectDuplicateIds(ids: readonly string[], label: string): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id)
    }
    seen.add(id)
  }
  return [...duplicates].map((id) => `${label}: duplicate id "${id}"`)
}

export function runCatalogDefinitionCoverageCheck(): CatalogCoverageReport {
  const failures: string[] = []

  failures.push(
    ...collectDuplicateIds(
      BUILDING_CATALOG.map((entry) => entry.id),
      'BUILDING_CATALOG',
    ),
  )
  failures.push(
    ...collectDuplicateIds(
      MACHINE_CATALOG.map((entry) => entry.id),
      'MACHINE_CATALOG',
    ),
  )
  failures.push(
    ...collectDuplicateIds(
      ATTACHMENT_CATALOG.map((entry) => entry.id),
      'ATTACHMENT_CATALOG',
    ),
  )
  failures.push(
    ...collectDuplicateIds(
      getStudioPlacementCatalog().map((entry) => entry.id),
      'StudioPlacementCatalog',
    ),
  )

  for (const asset of getAllGameplayAssetDefinitions()) {
    failures.push(
      ...validateAnchorTemplates(asset.id, asset.category, asset.defaultAnchors),
    )
  }

  return {
    buildingCount: BUILDING_CATALOG.length,
    machineCount: MACHINE_CATALOG.length,
    attachmentCount: ATTACHMENT_CATALOG.length,
    studioPlacementCount: getStudioPlacementCatalog().length,
    placementEntityCount: 0,
    passed: failures.length === 0,
    failures,
  }
}

function childAnchors(map: WorldMapDocument, parentId: string) {
  return getSceneAnchors(map.objects).filter(
    (anchor) =>
      parseSceneAnchorProperties(anchor.properties)?.parentObjectId === parentId,
  )
}

function missingRequiredForParent(
  map: WorldMapDocument,
  parentId: string,
  templates: ReturnType<typeof getRequiredAnchorTemplates>,
  machineId?: string,
): string[] {
  const anchors = childAnchors(map, parentId)
  const missing: string[] = []
  for (const template of templates) {
    const entityId =
      template.entityId === '{machineId}' ? machineId : template.entityId
    const found = anchors.some((anchor) => {
      const props = parseSceneAnchorProperties(anchor.properties)
      if (!props || props.anchorKind !== template.anchorKind) {
        return false
      }
      if (entityId && props.entityId !== entityId) {
        return false
      }
      return props.label === template.label || !entityId
    })
    if (!found) {
      missing.push(`${template.label} (${template.anchorKind})`)
    }
  }
  return missing
}

/** Map with one instance of every catalog building, machine, and attachment. */
export function buildCatalogCoveragePlacementMap(): WorldMapDocument {
  const width = 2400
  const depth = 2400
  const terrainObject = {
    id: 'terrain_ground',
    layer: 'terrain' as const,
    kind: 'ground',
    name: 'Ground',
    transform: { position: { x: 0, y: 0, z: 0 } },
    shape: { type: 'box' as const, width, height: 0.1, depth },
  }

  let map: WorldMapDocument = {
    formatVersion: WORLD_MAP_FORMAT_VERSION,
    id: 'catalog_coverage_placement',
    name: 'Catalog Coverage Placement',
    meta: {
      author: 'FarmOS E2E',
      description: 'One placement per catalog asset for anchor regression',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    terrain: ensureTerrainHeightfield({ width, height: depth }),
    objects: [terrainObject],
  }

  const surfaceY = 0
  let gridX = -1000
  let gridZ = -1000
  const step = 35

  const advanceGrid = () => {
    gridX += step
    if (gridX > 1000) {
      gridX = -1000
      gridZ += step
    }
  }

  for (const building of BUILDING_CATALOG) {
    const buildingObject = createBuildingObject(gridX, gridZ, {
      buildingType: building.id as BuildingTypeId,
      surfaceY,
      name: building.label,
    })
    const anchors = createDefaultBuildingAnchors(
      buildingObject,
      building.id as BuildingTypeId,
      surfaceY,
    )
    map = {
      ...map,
      objects: [
        ...map.objects,
        {
          ...buildingObject,
          properties: {
            ...buildingObject.properties,
            anchorIds: anchors.map((anchor) => anchor.id),
          },
        },
        ...anchors,
      ],
    }
    advanceGrid()
  }

  for (const entry of getStudioPlacementCatalog()) {
    const machineId =
      entry.catalogKind === 'machine'
        ? allocateMapMachineInstanceId(map, entry)
        : undefined
    const attachmentInstanceId =
      entry.catalogKind === 'attachment' && entry.attachmentCatalogId
        ? allocateMapAttachmentInstanceId(map, entry.attachmentCatalogId)
        : undefined
    const vehicle = createVehiclePlacementObject(gridX, gridZ, {
      placementEntry: entry,
      surfaceY,
      machineId,
      attachmentInstanceId,
      name: entry.name,
    })
    const anchors = createDefaultPlacementAnchors(
      vehicle,
      entry,
      surfaceY,
      machineId,
    )
    map = {
      ...map,
      objects: [
        ...map.objects,
        vehicle,
        ...anchors,
      ],
    }
    advanceGrid()
  }

  return map
}

export function runCatalogPlacementCoverageCheck(
  map: WorldMapDocument,
): CatalogCoverageReport {
  const definitionReport = runCatalogDefinitionCoverageCheck()
  const failures = [...definitionReport.failures]

  for (const building of map.objects.filter((object) => object.layer === 'buildings')) {
    const props = parseBuildingProperties(building.properties)
    if (!props) {
      failures.push(`Building ${building.id}: invalid properties`)
      continue
    }
    const templates = getBuildingAnchorTemplates(props.buildingType)
    const missing = missingRequiredForParent(
      map,
      building.id,
      getRequiredAnchorTemplates(templates),
    )
    if (missing.length > 0) {
      failures.push(
        `Building ${props.buildingType} missing required anchors after placement: ${missing.join(', ')}`,
      )
    }
  }

  for (const vehicle of map.objects.filter((object) => object.layer === 'vehicles')) {
    const props = parseVehiclePlacementProperties(vehicle.properties)
    if (!props) {
      failures.push(`Vehicle ${vehicle.id}: invalid properties`)
      continue
    }
    const catalogId =
      props.placementKind === 'attachment'
        ? props.attachmentCatalogId
        : props.machineId ?? MachineId.Tractor1
    const catalogKind =
      props.placementKind === 'attachment' ? 'attachment' : 'machine'
    const templates = getPlacementAnchorTemplates(
      catalogKind,
      catalogId ?? AttachmentCatalogId.Plow,
    )
    const missing = missingRequiredForParent(
      map,
      vehicle.id,
      getRequiredAnchorTemplates(templates),
      props.machineId,
    )
    if (missing.length > 0) {
      failures.push(
        `Vehicle ${props.placementCatalogId ?? vehicle.id} missing required anchors after placement: ${missing.join(', ')}`,
      )
    }
  }

  const placementEntityCount =
    BUILDING_CATALOG.length + getStudioPlacementCatalog().length

  return {
    buildingCount: BUILDING_CATALOG.length,
    machineCount: MACHINE_CATALOG.length,
    attachmentCount: ATTACHMENT_CATALOG.length,
    studioPlacementCount: getStudioPlacementCatalog().length,
    placementEntityCount,
    passed: failures.length === 0,
    failures,
  }
}
