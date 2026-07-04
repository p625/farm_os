import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import { WORLD_MAP_FORMAT_VERSION } from '@/types/world-map.ts'
import { getRoadTypeDefinition } from '@/studio/road/RoadTypePalette.ts'
import { getBuildingTypeDefinition } from '@/studio/building/BuildingTypePalette.ts'
import { buildBuildingMapObject } from '@/studio/building/buildingObject.ts'
import { getWaterTypeDefinition } from '@/studio/water/WaterTypePalette.ts'
import {
  FIELD_SURFACE_LIFT,
  FIELD_SURFACE_THICKNESS,
} from '@/studio/parcel/parcelObject.ts'
import { createMap01BlockoutData } from '@/maps/map-01-blockout/layoutSpec.ts'
import {
  buildMap01TerrainHeightfield,
  sampleMap01SurfaceY,
} from '@/maps/map-01-blockout/terrainHeight.ts'
import { expandVegetationZones } from '@/maps/map-01-blockout/expandVegetationZones.ts'
import type {
  Map01BlockoutData,
  Map01BuildingPlacement,
  Map01FieldParcel,
  Map01Poi,
  Map01RoadSegment,
  Map01WaterBody,
} from '@/maps/map-01-blockout/types.ts'
import type { FieldBlockId } from '@/config/map-01-layout.ts'
import type { RoadControlPoint } from '@/types/road.ts'
import type { WaterControlPoint } from '@/types/water.ts'

const now = () => new Date().toISOString()

function sampleSurfaceY(worldX: number, worldZ: number): number {
  return sampleMap01SurfaceY(worldX, worldZ)
}

function buildTerrainObject(data: Map01BlockoutData): MapObject {
  const { terrain } = data
  return {
    id: 'terrain_ground',
    layer: 'terrain',
    kind: 'ground',
    name: 'Ground',
    transform: {
      position: { x: terrain.origin.x, y: 0, z: terrain.origin.z },
    },
    shape: {
      type: 'box',
      width: terrain.width,
      height: 0.1,
      depth: terrain.height,
    },
  }
}

function buildFieldObject(field: Map01FieldParcel): MapObject {
  const surfaceY = sampleSurfaceY(field.center.x, field.center.z) + FIELD_SURFACE_LIFT
  const parcelBlock =
    field.parcelBlock === 'M' ? 'M' : (field.parcelBlock as FieldBlockId)

  return {
    id: field.id,
    layer: 'fields',
    kind: field.kind,
    name: field.name,
    transform: {
      position: { x: field.center.x, y: surfaceY, z: field.center.z },
      ...(field.rotationY !== undefined ? { rotationY: field.rotationY } : {}),
    },
    shape: {
      type: 'box',
      width: field.size.width,
      height: FIELD_SURFACE_THICKNESS,
      depth: field.size.depth,
    },
    properties: {
      parcelBlock,
      parcelId: field.parcelId,
      fertility: field.fertility,
      ...(field.roadAccess ? { roadAccess: field.roadAccess } : {}),
      ...(field.kind === 'field' ? { catalogId: field.id } : {}),
    },
  }
}

function buildFarmyardObject(): MapObject {
  const x = 0
  const z = -1100
  return {
    id: 'building_farmyard',
    layer: 'buildings',
    kind: 'farmyard',
    name: 'Dvůr statku',
    transform: {
      position: { x, y: sampleSurfaceY(x, z), z },
    },
    shape: { type: 'box', width: 120, height: 0.12, depth: 90 },
    properties: {},
  }
}

function buildRoadObject(road: Map01RoadSegment): MapObject {
  const roadType = getRoadTypeDefinition(road.roadKind)
  const points: RoadControlPoint[] = road.points.map((point) => ({
    x: point.x,
    y: sampleSurfaceY(point.x, point.z),
    z: point.z,
  }))

  return {
    id: road.id,
    layer: 'roads',
    kind: 'road',
    name: road.name || roadType.label,
    transform: { position: { x: 0, y: 0, z: 0 } },
    properties: {
      roadKind: road.roadKind,
      roadCategory: road.category,
      points,
    },
  }
}

function buildBuildingObject(building: Map01BuildingPlacement): MapObject {
  const definition = getBuildingTypeDefinition(building.buildingType)
  const surfaceY = sampleSurfaceY(building.position.x, building.position.z)
  return buildBuildingMapObject(
    building.id,
    building.position.x,
    building.position.z,
    definition,
    {
      surfaceY,
      name: building.name,
      ...(building.rotationY !== undefined ? { rotationY: building.rotationY } : {}),
    },
  )
}

function buildWaterObject(water: Map01WaterBody): MapObject {
  const definition = getWaterTypeDefinition(water.waterType)

  if (water.placementKind === 'spline' && water.points) {
    const points: WaterControlPoint[] = water.points.map((point) => ({
      x: point.x,
      y: sampleSurfaceY(point.x, point.z) - 1.5,
      z: point.z,
    }))
    const kind = water.waterType === 'water_stream_small' ? 'stream' : 'river'
    return {
      id: water.id,
      layer: 'water',
      kind,
      name: water.name || definition.label,
      transform: {
        position: { x: points[0].x, y: points[0].y, z: points[0].z },
      },
      properties: {
        waterType: water.waterType,
        placementKind: 'spline',
        points,
      },
    }
  }

  const center = water.center!
  const radiusX = water.radiusX ?? 40
  const radiusZ = water.radiusZ ?? 40
  const surfaceY = sampleSurfaceY(center.x, center.z) - 0.8
  const kind =
    water.waterType === 'water_pool'
      ? 'pool'
      : water.waterType === 'water_pond_small'
        ? 'pond'
        : 'pond_large'

  return {
    id: water.id,
    layer: 'water',
    kind,
    name: water.name || definition.label,
    transform: {
      position: { x: center.x, y: surfaceY, z: center.z },
    },
    shape: {
      type: 'box',
      width: radiusX * 2,
      height: 0.2,
      depth: radiusZ * 2,
    },
    properties: {
      waterType: water.waterType,
      placementKind: 'area',
      radiusX,
      radiusZ,
    },
  }
}

function buildPoiObject(poi: Map01Poi): MapObject {
  return {
    id: poi.id,
    layer: 'poi',
    kind: poi.kind,
    name: poi.name,
    transform: {
      position: {
        x: poi.position.x,
        y: sampleSurfaceY(poi.position.x, poi.position.z),
        z: poi.position.z,
      },
    },
    ...(poi.properties ? { properties: { ...poi.properties } } : {}),
  }
}

export function assembleMap01WorldDocument(
  data: Map01BlockoutData = createMap01BlockoutData(),
): WorldMapDocument {
  const { heights, surfaces } = buildMap01TerrainHeightfield(data.terrain)
  const timestamp = data.metadata.createdAt || now()

  const objects: MapObject[] = [
    buildTerrainObject(data),
    buildFarmyardObject(),
    ...data.fields.map(buildFieldObject),
    ...data.roads.map(buildRoadObject),
    ...data.buildings.map(buildBuildingObject),
    ...data.water.map(buildWaterObject),
    ...expandVegetationZones(data.vegetation),
    ...data.poi.map(buildPoiObject),
  ]

  return {
    formatVersion: WORLD_MAP_FORMAT_VERSION,
    id: data.metadata.id,
    name: data.metadata.name,
    meta: {
      author: data.metadata.author,
      description: data.metadata.description,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    terrain: {
      width: data.terrain.width,
      height: data.terrain.height,
      resolution: data.terrain.resolution,
      heights,
      surfaces,
    },
    objects,
  }
}
