import { WORLD_MAP_FORMAT_VERSION } from '@/types/world-map.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import type {
  MapValidationIssue,
  MapValidationReport,
} from '@/types/map-validation.ts'
import { validateParcelFootprint } from '@/studio/parcel/ParcelValidation.ts'
import { getFieldParcelFootprint, parseFieldParcelProperties } from '@/types/parcel.ts'
import { parseRoadProperties } from '@/types/road.ts'
import { parseVegetationProperties } from '@/types/vegetation.ts'
import { parseBuildingProperties } from '@/types/building.ts'
import { parseWaterProperties } from '@/types/water.ts'
import { getWaterTypeDefinition } from '@/studio/water/WaterTypePalette.ts'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { footprintsOverlap } from '@/studio/parcel/ParcelMath.ts'
import {
  getTerrainBounds,
  getTerrainGroundObject,
  isFootprintInsideTerrainBounds,
  isPointInsideTerrainBounds,
} from '@/studio/validation/terrainBounds.ts'
import { getBoxObjectFootprint } from '@/studio/validation/ObjectFootprint.ts'
import { validateSceneAnchors } from '@/studio/validation/validateAnchors.ts'
import { validateFieldTestStates } from '@/studio/validation/validateFieldTestState.ts'
import { validateParcelSemantics } from '@/studio/validation/validateParcels.ts'
import { validateMachinePlacements } from '@/studio/validation/validateMachines.ts'
import { validateGameplayAssets } from '@/studio/validation/validateGameplayAssets.ts'

let issueCounter = 0

function nextIssueId(ruleId: string, objectId?: string): string {
  issueCounter += 1
  return `${ruleId}_${objectId ?? issueCounter}`
}

function pushIssue(
  issues: MapValidationIssue[],
  issue: Omit<MapValidationIssue, 'id'>,
): void {
  issues.push({
    id: nextIssueId(issue.ruleId, issue.objectId),
    ...issue,
  })
}

function summarize(issues: MapValidationIssue[]): MapValidationReport {
  const errorCount = issues.filter((issue) => issue.severity === 'error').length
  const warnCount = issues.filter((issue) => issue.severity === 'warn').length
  const infoCount = issues.filter((issue) => issue.severity === 'info').length
  return {
    runAt: new Date().toISOString(),
    issueCount: issues.length,
    errorCount,
    warnCount,
    infoCount,
    issues,
    passed: errorCount === 0,
  }
}

export function validateWorldMap(map: WorldMapDocument): MapValidationReport {
  issueCounter = 0
  const issues: MapValidationIssue[] = []

  validateDocument(map, issues)
  const bounds = getTerrainBounds(map)
  validateTerrainData(map, issues)
  validateUniqueIds(map, issues)
  validateFields(map, bounds, issues)
  validateRoads(map, bounds, issues)
  validateBuildings(map, bounds, issues)
  validateVegetation(map, bounds, issues)
  validateWater(map, bounds, issues)
  validateSceneAnchors(map, issues)
  validateMachinePlacements(map, (issue) => pushIssue(issues, issue))
  validateGameplayAssets(map, (issue) => pushIssue(issues, issue))
  validateMap01Recommendations(map, issues)

  return summarize(issues)
}

function validateDocument(map: WorldMapDocument, issues: MapValidationIssue[]): void {
  if (map.formatVersion !== WORLD_MAP_FORMAT_VERSION) {
    pushIssue(issues, {
      ruleId: 'document-format',
      severity: 'error',
      message: `Unsupported format version ${map.formatVersion} (expected ${WORLD_MAP_FORMAT_VERSION}).`,
    })
  }
  if (!map.id.trim()) {
    pushIssue(issues, {
      ruleId: 'document-id',
      severity: 'error',
      message: 'Map id is empty.',
    })
  }
  if (!map.name.trim()) {
    pushIssue(issues, {
      ruleId: 'document-name',
      severity: 'warn',
      message: 'Map name is empty.',
    })
  }
  const ground = getTerrainGroundObject(map)
  if (!ground) {
    pushIssue(issues, {
      ruleId: 'terrain-ground',
      severity: 'error',
      message: 'Missing terrain_ground object.',
      layer: 'terrain',
    })
    return
  }
  if (ground.shape?.type !== 'box') {
    pushIssue(issues, {
      ruleId: 'terrain-ground',
      severity: 'error',
      message: 'terrain_ground must use a box shape.',
      objectId: ground.id,
      layer: 'terrain',
      position: ground.transform.position,
    })
  }
}

function validateTerrainData(
  map: WorldMapDocument,
  issues: MapValidationIssue[],
): void {
  const field = ensureTerrainHeightfield(map.terrain)
  const expected = field.resolution * field.resolution
  if (field.heights.length !== expected) {
    pushIssue(issues, {
      ruleId: 'terrain-heightfield',
      severity: 'error',
      message: `Terrain heights length ${field.heights.length} does not match resolution² (${expected}).`,
      layer: 'terrain',
    })
  }
  if (field.surfaces.length !== expected) {
    pushIssue(issues, {
      ruleId: 'terrain-surfaces',
      severity: 'warn',
      message: `Terrain surface indices length ${field.surfaces.length} does not match resolution² (${expected}).`,
      layer: 'terrain',
    })
  }
}

function validateUniqueIds(
  map: WorldMapDocument,
  issues: MapValidationIssue[],
): void {
  const seen = new Map<string, string>()
  for (const object of map.objects) {
    const previous = seen.get(object.id)
    if (previous) {
      pushIssue(issues, {
        ruleId: 'unique-ids',
        severity: 'error',
        message: `Duplicate object id "${object.id}".`,
        objectId: object.id,
        layer: object.layer,
        position: object.transform.position,
      })
      continue
    }
    seen.set(object.id, object.id)
  }
}

function validateFields(
  map: WorldMapDocument,
  bounds: ReturnType<typeof getTerrainBounds>,
  issues: MapValidationIssue[],
): void {
  const fields = map.objects.filter((object) => object.layer === 'fields')
  if (fields.length === 0) {
    pushIssue(issues, {
      ruleId: 'fields-present',
      severity: 'warn',
      message: 'No field parcels placed yet.',
      layer: 'fields',
    })
  }

  for (const field of fields) {
    const props = parseFieldParcelProperties(field.properties)
    if (!props) {
      pushIssue(issues, {
        ruleId: 'fields-properties',
        severity: 'error',
        message: `Field "${field.name ?? field.id}" is missing parcelBlock metadata.`,
        objectId: field.id,
        layer: 'fields',
        position: field.transform.position,
      })
      continue
    }
    if (props.fertility < 0 || props.fertility > 100) {
      pushIssue(issues, {
        ruleId: 'fields-fertility',
        severity: 'warn',
        message: `Field "${field.name ?? field.id}" fertility ${props.fertility} is outside 0–100.`,
        objectId: field.id,
        layer: 'fields',
        position: field.transform.position,
      })
    }

    const footprint = getFieldParcelFootprint(field)
    if (!footprint) {
      pushIssue(issues, {
        ruleId: 'fields-shape',
        severity: 'error',
        message: `Field "${field.name ?? field.id}" must use a box or polygon footprint.`,
        objectId: field.id,
        layer: 'fields',
        position: field.transform.position,
      })
      continue
    }

    const validation = validateParcelFootprint(map, footprint, field.id)
    if (!validation.ok) {
      pushIssue(issues, {
        ruleId: 'fields-footprint',
        severity: 'error',
        message: `Field "${field.name ?? field.id}": ${validation.message ?? 'Invalid footprint.'}`,
        objectId: field.id,
        layer: 'fields',
        position: {
          x: footprint.centerX,
          y: field.transform.position.y,
          z: footprint.centerZ,
        },
      })
    } else if (bounds && !isFootprintInsideTerrainBounds(bounds, footprint)) {
      pushIssue(issues, {
        ruleId: 'fields-bounds',
        severity: 'error',
        message: `Field "${field.name ?? field.id}" extends outside terrain bounds.`,
        objectId: field.id,
        layer: 'fields',
        position: {
          x: footprint.centerX,
          y: field.transform.position.y,
          z: footprint.centerZ,
        },
      })
    }
  }

  validateFieldTestStates(map, (issue) => pushIssue(issues, issue))
  validateParcelSemantics(map, bounds, (issue) => pushIssue(issues, issue))
}

function validateRoads(
  map: WorldMapDocument,
  bounds: ReturnType<typeof getTerrainBounds>,
  issues: MapValidationIssue[],
): void {
  const roads = map.objects.filter(
    (object) => object.layer === 'roads' && object.kind === 'road',
  )
  if (roads.length === 0) {
    pushIssue(issues, {
      ruleId: 'roads-present',
      severity: 'info',
      message: 'No roads defined — movement network may be incomplete.',
      layer: 'roads',
    })
  }

  for (const road of roads) {
    const props = parseRoadProperties(road.properties)
    if (!props) {
      pushIssue(issues, {
        ruleId: 'roads-properties',
        severity: 'error',
        message: `Road "${road.name ?? road.id}" has invalid or missing spline data.`,
        objectId: road.id,
        layer: 'roads',
        position: road.transform.position,
      })
      continue
    }

    if (bounds) {
      for (const [index, point] of props.points.entries()) {
        if (!isPointInsideTerrainBounds(bounds, point.x, point.z)) {
          pushIssue(issues, {
            ruleId: 'roads-bounds',
            severity: 'warn',
            message: `Road "${road.name ?? road.id}" point ${index + 1} is outside terrain bounds.`,
            objectId: road.id,
            layer: 'roads',
            position: point,
          })
        }
      }
    }
  }
}

function validateBuildings(
  map: WorldMapDocument,
  bounds: ReturnType<typeof getTerrainBounds>,
  issues: MapValidationIssue[],
): void {
  const buildings = map.objects.filter((object) => object.layer === 'buildings')
  const footprints: Array<{
    objectId: string
    name: string
    footprint: NonNullable<ReturnType<typeof getBoxObjectFootprint>>
  }> = []

  for (const building of buildings) {
    const props = parseBuildingProperties(building.properties)
    if (!props) {
      pushIssue(issues, {
        ruleId: 'buildings-properties',
        severity: 'error',
        message: `Building "${building.name ?? building.id}" has invalid buildingType metadata.`,
        objectId: building.id,
        layer: 'buildings',
        position: building.transform.position,
      })
      continue
    }

    const footprint = getBoxObjectFootprint(building)
    if (!footprint) {
      pushIssue(issues, {
        ruleId: 'buildings-shape',
        severity: 'error',
        message: `Building "${building.name ?? building.id}" must have a box shape.`,
        objectId: building.id,
        layer: 'buildings',
        position: building.transform.position,
      })
      continue
    }

    if (bounds && !isFootprintInsideTerrainBounds(bounds, footprint)) {
      pushIssue(issues, {
        ruleId: 'buildings-bounds',
        severity: 'warn',
        message: `Building "${building.name ?? building.id}" extends outside terrain bounds.`,
        objectId: building.id,
        layer: 'buildings',
        position: building.transform.position,
      })
    }

    footprints.push({
      objectId: building.id,
      name: building.name ?? building.id,
      footprint,
    })
  }

  for (let i = 0; i < footprints.length; i += 1) {
    for (let j = i + 1; j < footprints.length; j += 1) {
      const a = footprints[i]
      const b = footprints[j]
      if (footprintsOverlap(a.footprint, b.footprint)) {
        pushIssue(issues, {
          ruleId: 'buildings-overlap',
          severity: 'warn',
          message: `Buildings "${a.name}" and "${b.name}" overlap.`,
          objectId: a.objectId,
          layer: 'buildings',
          position: {
            x: a.footprint.centerX,
            y: 0,
            z: a.footprint.centerZ,
          },
        })
      }
    }
  }
}

function validateVegetation(
  map: WorldMapDocument,
  bounds: ReturnType<typeof getTerrainBounds>,
  issues: MapValidationIssue[],
): void {
  for (const object of map.objects) {
    if (object.layer !== 'vegetation') {
      continue
    }
    const props = parseVegetationProperties(object.properties)
    if (!props) {
      pushIssue(issues, {
        ruleId: 'vegetation-properties',
        severity: 'error',
        message: `Vegetation "${object.name ?? object.id}" has invalid vegetationType metadata.`,
        objectId: object.id,
        layer: 'vegetation',
        position: object.transform.position,
      })
      continue
    }
    if (
      bounds &&
      !isPointInsideTerrainBounds(
        bounds,
        object.transform.position.x,
        object.transform.position.z,
      )
    ) {
      pushIssue(issues, {
        ruleId: 'vegetation-bounds',
        severity: 'warn',
        message: `Vegetation "${object.name ?? object.id}" is outside terrain bounds.`,
        objectId: object.id,
        layer: 'vegetation',
        position: object.transform.position,
      })
    }
  }
}

function validateWater(
  map: WorldMapDocument,
  bounds: ReturnType<typeof getTerrainBounds>,
  issues: MapValidationIssue[],
): void {
  for (const object of map.objects) {
    if (object.layer !== 'water') {
      continue
    }
    const props = parseWaterProperties(object.properties)
    if (!props) {
      pushIssue(issues, {
        ruleId: 'water-properties',
        severity: 'error',
        message: `Water "${object.name ?? object.id}" has invalid water metadata.`,
        objectId: object.id,
        layer: 'water',
        position: object.transform.position,
      })
      continue
    }

    const definition = getWaterTypeDefinition(props.waterType)
    if (props.placementKind === 'area') {
      const minRadius = definition.minAreaRadius ?? 2
      if (props.radiusX < minRadius || props.radiusZ < minRadius) {
        pushIssue(issues, {
          ruleId: 'water-area-size',
          severity: 'warn',
          message: `Water "${object.name ?? object.id}" is smaller than recommended minimum (${minRadius} m).`,
          objectId: object.id,
          layer: 'water',
          position: object.transform.position,
        })
      }
    }

    if (bounds) {
      const { x, z } = object.transform.position
      if (!isPointInsideTerrainBounds(bounds, x, z)) {
        pushIssue(issues, {
          ruleId: 'water-bounds',
          severity: 'warn',
          message: `Water "${object.name ?? object.id}" center is outside terrain bounds.`,
          objectId: object.id,
          layer: 'water',
          position: object.transform.position,
        })
      }
    }
  }
}

function validateMap01Recommendations(
  map: WorldMapDocument,
  issues: MapValidationIssue[],
): void {
  const isMap01 =
    map.id.includes('map_01') ||
    map.id.includes('map01') ||
    map.name.toLowerCase().includes('map 01') ||
    map.name.toLowerCase().includes('central europe')

  if (!isMap01) {
    return
  }

  const hasRiver = map.objects.some((object) => {
    if (object.layer !== 'water') {
      return false
    }
    const props = parseWaterProperties(object.properties)
    return props?.waterType === 'water_river_medium'
  })
  if (!hasRiver) {
    pushIssue(issues, {
      ruleId: 'map01-river',
      severity: 'info',
      message:
        'Map 01 guideline: place a medium river (water_river_medium) as a primary landmark.',
      layer: 'water',
    })
  }

  const fieldBlocks = new Set<string>()
  for (const object of map.objects) {
    if (object.layer !== 'fields') {
      continue
    }
    const props = parseFieldParcelProperties(object.properties)
    if (props) {
      fieldBlocks.add(props.parcelBlock)
    }
  }
  if (!fieldBlocks.has('A')) {
    pushIssue(issues, {
      ruleId: 'map01-block-a',
      severity: 'info',
      message: 'Map 01 guideline: block A fields are expected near the farm hub.',
      layer: 'fields',
    })
  }
  if (!fieldBlocks.has('B')) {
    pushIssue(issues, {
      ruleId: 'map01-block-b',
      severity: 'info',
      message: 'Map 01 guideline: block B open fields support the management view.',
      layer: 'fields',
    })
  }

  const villageBuildings = map.objects.filter(
    (object) =>
      object.layer === 'buildings' &&
      parseBuildingProperties(object.properties)?.category === 'civic',
  )
  if (villageBuildings.length === 0) {
    pushIssue(issues, {
      ruleId: 'map01-village',
      severity: 'info',
      message:
        'Map 01 guideline: add civic buildings (church, town hall) for the village landmark.',
      layer: 'buildings',
    })
  }
}
