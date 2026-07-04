import type { MapObject } from '@/types/world-map.ts'
import type { Map01VegetationZone } from '@/maps/map-01-blockout/types.ts'
import { buildVegetationMapObject } from '@/studio/vegetation/vegetationObject.ts'
import { getVegetationTypeDefinition } from '@/studio/vegetation/VegetationTypePalette.ts'
import { sampleMap01SurfaceY } from '@/maps/map-01-blockout/terrainHeight.ts'

const MAX_TREES_PER_ZONE = 220

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), state | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function zoneTreeCount(zone: Map01VegetationZone): number {
  const width = zone.bounds.maxX - zone.bounds.minX
  const depth = zone.bounds.maxZ - zone.bounds.minZ
  const raw = Math.round(width * depth * zone.densityPerSqM)
  return Math.min(MAX_TREES_PER_ZONE, Math.max(0, raw))
}

function alleyOffsetX(zone: Map01VegetationZone, rand: () => number): number {
  const centerX = (zone.bounds.minX + zone.bounds.maxX) * 0.5
  const halfWidth = (zone.bounds.maxX - zone.bounds.minX) * 0.5
  const side = rand() < 0.5 ? -1 : 1
  return centerX + side * halfWidth * (0.55 + rand() * 0.35)
}

export function expandVegetationZones(
  zones: readonly Map01VegetationZone[],
  startId = 1,
): MapObject[] {
  const objects: MapObject[] = []
  let vegId = startId

  for (const zone of zones) {
    const count = zoneTreeCount(zone)
    if (count === 0) {
      continue
    }
    const rand = mulberry32(zone.seed)
    const definition = getVegetationTypeDefinition(zone.vegetationType)

    for (let index = 0; index < count; index += 1) {
      const x =
        zone.category === 'alley'
          ? alleyOffsetX(zone, rand)
          : zone.bounds.minX + rand() * (zone.bounds.maxX - zone.bounds.minX)
      const z = zone.bounds.minZ + rand() * (zone.bounds.maxZ - zone.bounds.minZ)
      const surfaceY = sampleMap01SurfaceY(x, z)
      const id = `veg_${vegId}`
      vegId += 1
      objects.push(
        buildVegetationMapObject(id, x, z, definition, {
          surfaceY,
          rotationY: rand() * Math.PI * 2,
          name: zone.name,
        }),
      )
    }
  }

  return objects
}
