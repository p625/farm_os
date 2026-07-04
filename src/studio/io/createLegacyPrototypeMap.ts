import { FIELD_CATALOG } from '@/config/field-catalog.ts'
import {
  FARM_HUB,
  FIELD_LAYOUT,
  getWorldCenter,
  getWorldTerrainSize,
} from '@/config/map-01-layout.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import { WORLD_MAP_FORMAT_VERSION } from '@/types/world-map.ts'

const now = () => new Date().toISOString()

/** Bootstrap map from current Map 01 layout config (not baked into runtime). */
export function createLegacyPrototypeMap(): WorldMapDocument {
  const catalogById = new Map(FIELD_CATALOG.map((e) => [e.id, e]))
  const { width, depth } = getWorldTerrainSize()
  const center = getWorldCenter()

  const fieldObjects = FIELD_LAYOUT.map((layout) => {
    const catalog = catalogById.get(layout.id)
    return {
      id: layout.id,
      layer: 'fields' as const,
      kind: 'field',
      name: catalog?.name ?? layout.id,
      transform: {
        position: { x: layout.position.x, y: 0.04, z: layout.position.z },
      },
      shape: {
        type: 'box' as const,
        width: layout.meshSize.width,
        height: 0.08,
        depth: layout.meshSize.depth,
      },
      properties: {
        parcelBlock: layout.blockId,
        fertility: catalog?.fertility,
        roadAccess: layout.roadAccess,
      },
    }
  })

  return {
    formatVersion: WORLD_MAP_FORMAT_VERSION,
    id: 'map_01',
    name: 'Map 01 — Central Europe',
    meta: {
      author: 'FarmOS Studio',
      description: 'Layout exported from map-01-layout config',
      createdAt: now(),
      updatedAt: now(),
    },
    terrain: { width, height: depth },
    objects: [
      {
        id: 'terrain_ground',
        layer: 'terrain',
        kind: 'ground',
        name: 'Ground',
        transform: { position: { x: center.x, y: 0, z: center.z } },
        shape: { type: 'box', width, height: 0.1, depth },
      },
      ...fieldObjects,
      {
        id: 'building_farmyard',
        layer: 'buildings',
        kind: 'farmyard',
        name: 'Farmyard',
        transform: {
          position: {
            x: FARM_HUB.farmyard.position.x,
            y: 0.03,
            z: FARM_HUB.farmyard.position.z,
          },
        },
        shape: {
          type: 'box',
          width: FARM_HUB.farmyard.size.width,
          height: 0.06,
          depth: FARM_HUB.farmyard.size.depth,
        },
      },
      {
        id: 'building_barn',
        layer: 'buildings',
        kind: 'barn',
        name: 'Barn',
        transform: {
          position: {
            x: FARM_HUB.barn.position.x,
            y: 0,
            z: FARM_HUB.barn.position.z,
          },
        },
        shape: { type: 'box', width: 8, height: 4, depth: 6 },
      },
      {
        id: 'building_mill',
        layer: 'buildings',
        kind: 'mill',
        name: 'Mill',
        transform: {
          position: {
            x: FARM_HUB.mill.position.x,
            y: 0,
            z: FARM_HUB.mill.position.z,
          },
        },
        shape: { type: 'box', width: 6, height: 3, depth: 5 },
      },
      {
        id: 'building_dealership',
        layer: 'buildings',
        kind: 'dealership',
        name: 'Dealership',
        transform: {
          position: {
            x: FARM_HUB.dealership.position.x,
            y: 0,
            z: FARM_HUB.dealership.position.z,
          },
        },
        shape: { type: 'box', width: 10, height: 3.5, depth: 8 },
      },
      {
        id: 'poi_tractor_spawn',
        layer: 'poi',
        kind: 'spawn',
        name: 'Tractor Home',
        transform: {
          position: {
            x: FARM_HUB.tractorHome.position.x,
            y: 0,
            z: FARM_HUB.tractorHome.position.z,
          },
        },
        properties: { entity: 'tractor' },
      },
      {
        id: 'debug_origin',
        layer: 'debug',
        kind: 'marker',
        name: 'Origin',
        transform: { position: { x: 0, y: 0.5, z: 0 } },
        shape: { type: 'box', width: 0.5, height: 0.5, depth: 0.5 },
      },
    ],
  }
}
