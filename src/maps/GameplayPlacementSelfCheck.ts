import type { WorldMapDocument } from '@/types/world-map.ts'
import { WORLD_MAP_FORMAT_VERSION } from '@/types/world-map.ts'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { createBuildingObject } from '@/studio/building/buildingObject.ts'
import {
  createDefaultBuildingAnchors,
  createDefaultPlacementAnchors,
} from '@/studio/anchor/anchorObject.ts'
import { createVehiclePlacementObject } from '@/studio/vehicle/vehicleObject.ts'
import { getStudioPlacementEntry } from '@/studio/catalog/StudioPlacementCatalog.ts'
import {
  allocateMapAttachmentInstanceId,
  allocateMapMachineInstanceId,
} from '@/studio/vehicle/allocatePlacementIds.ts'
import { validateWorldMap } from '@/studio/validation/validateMap.ts'
import { exportWorldMapToPackage } from '@/studio/export/WorldMapExporter.ts'
import { buildFarmHubFromAnchors } from '@/studio/anchor/anchorHubExport.ts'
import { resolveRuntimeMachineSpawns } from '@/maps/resolveRuntimeMachineSpawns.ts'
import { resolveRuntimeAttachmentSpawns } from '@/maps/resolveRuntimeAttachmentSpawns.ts'
import { getSceneAnchors, parseSceneAnchorProperties } from '@/types/scene-anchor.ts'
import { parseBuildingProperties } from '@/types/building.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'
import {
  getBuildingAssetDefinition,
  getPlacementAnchorTemplates,
  getRequiredAnchorTemplates,
} from '@/config/gameplay-asset-catalog.ts'
import { MachineId } from '@/types/machine.ts'
import { AttachmentCatalogId } from '@/types/attachment.ts'
import type { Scene } from '@babylonjs/core'
import { STUDIO_METADATA_KEY } from '@/studio/io/MapSceneBuilder.ts'

export function countGameplayAnchorGizmoMeshes(scene: Scene): number {
  return scene.meshes.filter((mesh) => {
    if (mesh.name.startsWith('studio_anc_')) {
      return true
    }
    const studio = mesh.metadata?.[STUDIO_METADATA_KEY] as
      | { kind?: string }
      | undefined
    return studio?.kind === 'anchor'
  }).length
}

export interface RuntimeScenePlacementSnapshot {
  tractorNodeCount: number
  combineNodeCount: number
  attachmentNodeCount: number
  gameplayAnchorMeshCount: number
  buildingCount: number
}

export function captureRuntimeSceneSnapshot(
  scene: Scene,
): RuntimeScenePlacementSnapshot {
  const tractorNodeCount = scene.transformNodes.filter(
    (node) => node.name === 'tractor',
  ).length
  const combineNodeCount = scene.transformNodes.filter(
    (node) => node.name === 'grain_combine' || node.name === 'corn_combine',
  ).length
  const attachmentNodeCount = scene.transformNodes.filter((node) =>
    node.name.startsWith('attachment_'),
  ).length
  const gameplayAnchorMeshCount = countGameplayAnchorGizmoMeshes(scene)
  const buildingCount = scene.meshes.filter((mesh) =>
    mesh.name.startsWith('bld_'),
  ).length

  return {
    tractorNodeCount,
    combineNodeCount,
    attachmentNodeCount,
    gameplayAnchorMeshCount,
    buildingCount,
  }
}

export interface GameplayPlacementSelfCheckReport {
  generatedAt: string
  mapId: string
  counts: {
    buildings: number
    vehicles: number
    attachments: number
    machines: number
    anchors: number
    validationErrors: number
    validationWarnings: number
  }
  entities: Array<{
    id: string
    kind: string
    name: string
    anchorCount: number
    missingRequiredAnchors: string[]
  }>
  runtime: {
    machineSpawns: number
    attachmentSpawns: number
    hubHasSiloEntry: boolean
    hubHasDealerEntry: boolean
    hubHasTractorHome: boolean
    duplicateMachineIds: string[]
  }
  validationIssueIds: string[]
  passed: boolean
  failures: string[]
}

function childAnchors(map: WorldMapDocument, parentId: string) {
  return getSceneAnchors(map.objects).filter(
    (anchor) =>
      parseSceneAnchorProperties(anchor.properties)?.parentObjectId === parentId,
  )
}

function missingRequiredForParent(
  map: WorldMapDocument,
  parent: { id: string; name?: string },
  templates: ReturnType<typeof getRequiredAnchorTemplates>,
  machineId?: string,
): string[] {
  const anchors = childAnchors(map, parent.id)
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

export function runGameplayPlacementSelfCheck(
  map: WorldMapDocument,
): GameplayPlacementSelfCheckReport {
  const failures: string[] = []
  const validation = validateWorldMap(map)
  const machineSpawns = resolveRuntimeMachineSpawns(map)
  const attachmentSpawns = resolveRuntimeAttachmentSpawns(map)
  const hub = buildFarmHubFromAnchors(map)

  const buildings = map.objects.filter((object) => object.layer === 'buildings')
  const vehicles = map.objects.filter((object) => object.layer === 'vehicles')
  const attachments = vehicles.filter((object) => {
    const props = parseVehiclePlacementProperties(object.properties)
    return props?.placementKind === 'attachment'
  })
  const machines = vehicles.filter((object) => {
    const props = parseVehiclePlacementProperties(object.properties)
    return props?.placementKind === 'machine' || Boolean(props?.machineId)
  })
  const anchors = getSceneAnchors(map.objects)

  const entities: GameplayPlacementSelfCheckReport['entities'] = []

  for (const building of buildings) {
    const props = parseBuildingProperties(building.properties)
    if (!props) {
      failures.push(`Building ${building.id} has invalid properties`)
      continue
    }
    const asset = getBuildingAssetDefinition(props.buildingType)
    const missing = missingRequiredForParent(
      map,
      building,
      getRequiredAnchorTemplates(asset.defaultAnchors),
    )
    if (missing.length > 0) {
      failures.push(
        `Building ${building.name ?? building.id} missing anchors: ${missing.join(', ')}`,
      )
    }
    entities.push({
      id: building.id,
      kind: props.buildingType,
      name: building.name ?? building.id,
      anchorCount: childAnchors(map, building.id).length,
      missingRequiredAnchors: missing,
    })
  }

  for (const vehicle of vehicles) {
    const props = parseVehiclePlacementProperties(vehicle.properties)
    if (!props) {
      failures.push(`Vehicle ${vehicle.id} has invalid properties`)
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
      vehicle,
      getRequiredAnchorTemplates(templates),
      props.machineId,
    )
    if (missing.length > 0) {
      failures.push(
        `Vehicle ${vehicle.name ?? vehicle.id} missing anchors: ${missing.join(', ')}`,
      )
    }
    entities.push({
      id: vehicle.id,
      kind: props.placementCatalogId ?? props.vehicleType ?? vehicle.id,
      name: vehicle.name ?? vehicle.id,
      anchorCount: childAnchors(map, vehicle.id).length,
      missingRequiredAnchors: missing,
    })
  }

  const machineIdCounts = new Map<string, number>()
  for (const spawn of machineSpawns) {
    machineIdCounts.set(
      spawn.machineId,
      (machineIdCounts.get(spawn.machineId) ?? 0) + 1,
    )
  }
  const duplicateMachineIds = [...machineIdCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
  if (duplicateMachineIds.length > 0) {
    failures.push(`Duplicate runtime machine ids: ${duplicateMachineIds.join(', ')}`)
  }

  if (
    machines.some((object) => {
      const props = parseVehiclePlacementProperties(object.properties)
      return props?.machineId === MachineId.Tractor1
    }) &&
    machineSpawns.filter((s) => s.machineId === MachineId.Tractor1).length !== 1
  ) {
    failures.push(
      `Expected exactly one tractor_1 spawn, got ${machineSpawns.filter((s) => s.machineId === MachineId.Tractor1).length}`,
    )
  }

  const studioMachinePlacements = machines.length > 0
  if (studioMachinePlacements && machineSpawns.length !== machines.length) {
    failures.push(
      `Studio map has ${machines.length} machine placement(s) but ${machineSpawns.length} runtime spawn(s)`,
    )
  }

  if (attachments.length > 0 && attachmentSpawns.length !== attachments.length) {
    failures.push(
      `Studio map has ${attachments.length} attachment placement(s) but ${attachmentSpawns.length} runtime spawn(s)`,
    )
  }

  if (validation.errorCount > 0) {
    failures.push(`Map validation has ${validation.errorCount} error(s)`)
  }

  return {
    generatedAt: new Date().toISOString(),
    mapId: map.id,
    counts: {
      buildings: buildings.length,
      vehicles: vehicles.length,
      attachments: attachments.length,
      machines: machines.length,
      anchors: anchors.length,
      validationErrors: validation.errorCount,
      validationWarnings: validation.warnCount,
    },
    entities,
    runtime: {
      machineSpawns: machineSpawns.length,
      attachmentSpawns: attachmentSpawns.length,
      hubHasSiloEntry: Boolean(hub.siloEntry),
      hubHasDealerEntry: Boolean(hub.dealerEntry),
      hubHasTractorHome: Boolean(hub.tractorHome),
      duplicateMachineIds,
    },
    validationIssueIds: validation.issues.map((issue) => issue.id),
    passed: failures.length === 0,
    failures,
  }
}

/** Build a minimal Studio test map with dealer, silo, tractor, plow, seeder, trailer. */
export function buildGameplayPlacementTestMap(): WorldMapDocument {
  const width = 400
  const depth = 400
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
    id: 'gameplay_placement_test',
    name: 'Gameplay Placement E2E Test',
    meta: {
      author: 'FarmOS E2E',
      description: 'Automated gameplay-aware placement test map',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    terrain: ensureTerrainHeightfield({ width, height: depth }),
    objects: [terrainObject],
  }

  const surfaceY = 0

  const placeBuilding = (
    buildingType: 'shop_general' | 'farm_silo',
    x: number,
    z: number,
    name: string,
  ) => {
    const building = createBuildingObject(x, z, {
      buildingType,
      surfaceY,
      name,
    })
    const anchors = createDefaultBuildingAnchors(building, buildingType, surfaceY)
    const withMeta: typeof building = {
      ...building,
      properties: {
        ...building.properties,
        anchorIds: anchors.map((anchor) => anchor.id),
      },
    }
    map = {
      ...map,
      objects: [...map.objects, withMeta, ...anchors],
    }
  }

  const placeVehicle = (placementId: string, x: number, z: number, name: string) => {
    const entry = getStudioPlacementEntry(placementId)
    if (!entry) {
      throw new Error(`Unknown placement ${placementId}`)
    }
    const machineId =
      entry.catalogKind === 'machine'
        ? allocateMapMachineInstanceId(map, entry)
        : undefined
    const attachmentInstanceId =
      entry.catalogKind === 'attachment' && entry.attachmentCatalogId
        ? allocateMapAttachmentInstanceId(map, entry.attachmentCatalogId)
        : undefined
    const vehicle = createVehiclePlacementObject(x, z, {
      placementEntry: entry,
      surfaceY,
      machineId,
      attachmentInstanceId,
      name,
    })
    const anchors = createDefaultPlacementAnchors(
      vehicle,
      entry,
      surfaceY,
      machineId,
    )
    map = {
      ...map,
      objects: [...map.objects, vehicle, ...anchors],
    }
  }

  placeBuilding('shop_general', -40, -30, 'Test Dealer')
  placeBuilding('farm_silo', 40, -30, 'Test Silo')
  placeVehicle('machine:tractor_1', 0, 20, 'Test Tractor')
  placeVehicle('attachment:plow', -15, 20, 'Test Plow')
  placeVehicle('attachment:seeder', 0, 35, 'Test Seeder')
  placeVehicle('attachment:wagon', 15, 20, 'Test Trailer')

  return map
}

export function exportGameplayPlacementTestPackage(map: WorldMapDocument) {
  return exportWorldMapToPackage(map, {
    packageId: 'gameplay_placement_test',
    packageName: 'Gameplay Placement E2E Test',
    description: 'E2E test map for gameplay-aware Studio placement',
  })
}
