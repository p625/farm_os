import { FARM_HUB } from '@/config/map-01-layout.ts'
import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { BuildingTypeId } from '@/types/building.ts'
import { parseBuildingProperties } from '@/types/building.ts'
import {
  buildBuildingMapObject,
  syncBuildingIdCounterFromMap,
} from '@/studio/building/buildingObject.ts'
import { sampleBuildingGroundY } from '@/studio/building/buildingSurface.ts'
import { getBuildingTypeDefinition } from '@/studio/building/BuildingTypePalette.ts'

const LEGACY_BUILDING_KIND_TO_TYPE: Partial<Record<string, BuildingTypeId>> = {
  barn: 'farm_barn',
  mill: 'farm_mill',
  dealership: 'shop_general',
}

const HUB_BUILDING_SPECS: Array<{
  id: string
  buildingType: BuildingTypeId
  x: number
  z: number
  name: string
}> = [
  {
    id: 'building_barn',
    buildingType: 'farm_barn',
    x: FARM_HUB.barn.position.x,
    z: FARM_HUB.barn.position.z,
    name: 'Stodola',
  },
  {
    id: 'building_silo',
    buildingType: 'farm_silo',
    x: FARM_HUB.barn.position.x + 4.2,
    z: FARM_HUB.barn.position.z - 0.8,
    name: 'Silo',
  },
  {
    id: 'building_mill',
    buildingType: 'farm_mill',
    x: FARM_HUB.mill.position.x,
    z: FARM_HUB.mill.position.z,
    name: 'Mlýn',
  },
  {
    id: 'building_dealership',
    buildingType: 'shop_general',
    x: FARM_HUB.dealership.position.x,
    z: FARM_HUB.dealership.position.z,
    name: 'Prodejna techniky',
  },
]

export function createMap01HubBuildings(map: WorldMapDocument): MapObject[] {
  return HUB_BUILDING_SPECS.map((spec) => {
    const definition = getBuildingTypeDefinition(spec.buildingType)
    const surfaceY = sampleBuildingGroundY(map, spec.x, spec.z)
    return buildBuildingMapObject(spec.id, spec.x, spec.z, definition, {
      surfaceY,
      name: spec.name,
    })
  })
}

function isLegacyBuildingObject(object: MapObject): boolean {
  if (object.layer !== 'buildings') {
    return false
  }
  if (parseBuildingProperties(object.properties)) {
    return false
  }
  return object.kind === 'farmyard' || object.kind in LEGACY_BUILDING_KIND_TO_TYPE
}

export function mapHasLegacyBuildings(map: WorldMapDocument): boolean {
  return map.objects.some(isLegacyBuildingObject)
}

export function migrateLegacyBuildings(map: WorldMapDocument): WorldMapDocument {
  if (!mapHasLegacyBuildings(map)) {
    return map
  }

  const hubById = new Map(
    createMap01HubBuildings(map).map((building) => [building.id, building]),
  )

  const nextObjects: MapObject[] = []
  const replacedHubIds = new Set<string>()

  for (const object of map.objects) {
    if (!isLegacyBuildingObject(object)) {
      nextObjects.push(object)
      continue
    }

    if (object.kind === 'farmyard') {
      continue
    }

    const typeId = LEGACY_BUILDING_KIND_TO_TYPE[object.kind]
    if (!typeId) {
      nextObjects.push(object)
      continue
    }

    const hubReplacement = hubById.get(object.id)
    if (hubReplacement) {
      nextObjects.push(hubReplacement)
      replacedHubIds.add(object.id)
      continue
    }

    const definition = getBuildingTypeDefinition(typeId)
    const { x, z } = object.transform.position
    const surfaceY = sampleBuildingGroundY(map, x, z)
    nextObjects.push(
      buildBuildingMapObject(object.id, x, z, definition, {
        surfaceY,
        rotationY: object.transform.rotationY,
        name: object.name,
      }),
    )
  }

  for (const [id, building] of hubById) {
    if (!replacedHubIds.has(id) && !nextObjects.some((object) => object.id === id)) {
      nextObjects.push(building)
    }
  }

  const migrated: WorldMapDocument = {
    ...map,
    objects: nextObjects,
    meta: {
      ...map.meta,
      updatedAt: new Date().toISOString(),
    },
  }

  syncBuildingIdCounterFromMap(migrated)
  return migrated
}
