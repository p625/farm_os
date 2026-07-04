import type { Map01BlockoutData } from '@/maps/map-01-blockout/types.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import { MAP_01_SIZE_M } from '@/maps/map-01-blockout/constants.ts'

export interface Map01ValidationIssue {
  level: 'error' | 'warn'
  message: string
}

export function validateMap01BlockoutData(
  data: Map01BlockoutData,
): Map01ValidationIssue[] {
  const issues: Map01ValidationIssue[] = []

  if (data.terrain.width !== MAP_01_SIZE_M || data.terrain.height !== MAP_01_SIZE_M) {
    issues.push({
      level: 'error',
      message: `Terrain must be ${MAP_01_SIZE_M}×${MAP_01_SIZE_M} m.`,
    })
  }

  const arableFields = data.fields.filter((field) => field.kind === 'field')
  const meadows = data.fields.filter((field) => field.kind === 'meadow')

  if (arableFields.length !== 9) {
    issues.push({
      level: 'error',
      message: `Expected 9 arable fields, found ${arableFields.length}.`,
    })
  }

  if (meadows.length < 3) {
    issues.push({
      level: 'warn',
      message: `Expected at least 3 meadows (Block M), found ${meadows.length}.`,
    })
  }

  const blocks = new Set(arableFields.map((field) => field.parcelBlock))
  for (const block of ['A', 'B', 'C'] as const) {
    if (!blocks.has(block)) {
      issues.push({
        level: 'error',
        message: `Missing arable fields for block ${block}.`,
      })
    }
  }

  const primaryRoad = data.roads.find((road) => road.category === 'primary')
  if (!primaryRoad) {
    issues.push({ level: 'error', message: 'Missing primary road.' })
  }

  const requiredRoadCategories = [
    'secondary',
    'farm',
    'field_access',
    'forest',
    'service',
  ] as const
  for (const category of requiredRoadCategories) {
    if (!data.roads.some((road) => road.category === category)) {
      issues.push({
        level: 'warn',
        message: `Missing road category: ${category}.`,
      })
    }
  }

  const heroViews = data.poi.filter((poi) => poi.kind === 'camera_moment')
  if (!heroViews.some((poi) => poi.properties?.viewId === 'CM-01')) {
    issues.push({ level: 'error', message: 'Missing Camera Moment CM-01.' })
  }
  if (!heroViews.some((poi) => poi.properties?.viewId === 'CM-02')) {
    issues.push({ level: 'error', message: 'Missing Camera Moment CM-02.' })
  }

  if (!data.poi.some((poi) => poi.id === 'poi_tractor_spawn')) {
    issues.push({ level: 'error', message: 'Missing tractor spawn POI.' })
  }

  if (!data.water.some((entry) => entry.id === 'water_river_main')) {
    issues.push({ level: 'error', message: 'Missing main river.' })
  }

  return issues
}

export function validateMap01WorldDocument(
  map: WorldMapDocument,
): Map01ValidationIssue[] {
  const issues: Map01ValidationIssue[] = []

  if (!map.objects.some((object) => object.id === 'terrain_ground')) {
    issues.push({ level: 'error', message: 'Missing terrain_ground object.' })
  }

  const gameFields = map.objects.filter(
    (object) => object.layer === 'fields' && object.kind === 'field',
  )
  if (gameFields.length !== 9) {
    issues.push({
      level: 'error',
      message: `World document must contain 9 game fields, found ${gameFields.length}.`,
    })
  }

  return issues
}
