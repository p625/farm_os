import { getActiveFarmHub } from '@/config/farm-layout.ts'
import { DEFAULT_ENVIRONMENT_BIOME_ID, getEnabledEnvironmentBiomes } from '@/config/environment/index.ts'
import type { EnvironmentBiomeDefinition, EnvironmentBiomeId } from '@/types/environment-art.ts'
import type { VegetationPlacementContext } from '@/types/vegetation-rendering.ts'
import {
  distanceToForestEdge,
  distanceToHedgerow,
  distanceToTreeLine,
  isInsideFieldCenter,
  isInsideRoad,
} from '@/rendering/vegetation/VegetationPlacementRules.ts'

const FOREST_INTERIOR_INSET = 6
const FOREST_EDGE_BAND = 8
const FARM_YARD_RADIUS = 22

export function sampleBiomeAt(
  context: VegetationPlacementContext,
  x: number,
  z: number,
): EnvironmentBiomeDefinition {
  const candidates: Array<{ biome: EnvironmentBiomeDefinition; score: number }> = []

  for (const biome of getEnabledEnvironmentBiomes()) {
    const score = scoreBiomeCandidate(biome.id, context, x, z)
    if (score > 0) {
      candidates.push({ biome, score: score + biome.priority * 0.01 })
    }
  }

  if (candidates.length === 0) {
    const fallback = getEnabledEnvironmentBiomes().find((b) => b.id === DEFAULT_ENVIRONMENT_BIOME_ID)
    return fallback ?? getEnabledEnvironmentBiomes()[0]
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates[0].biome
}

function scoreBiomeCandidate(
  biomeId: EnvironmentBiomeId,
  context: VegetationPlacementContext,
  x: number,
  z: number,
): number {
  const onRoad = isInsideRoad(context, x, z, 0.6)
  const fieldCenter = isInsideFieldCenter(context, x, z, 2.5)
  const forestEdgeDist = distanceToForestEdge(context, x, z)
  const insideForest = forestEdgeDist === 0
  const nearForestEdge = forestEdgeDist > 0 && forestEdgeDist < FOREST_EDGE_BAND
  const deepForest = insideForest && forestEdgeDist >= FOREST_INTERIOR_INSET
  const farmDist = distanceToFarmHub(x, z)

  switch (biomeId) {
    case 'roadside':
      return onRoad ? 1 : context.roadRects.reduce((best, road) => {
        const dist = Math.hypot(x - road.x, z - road.z) - Math.max(road.halfWidth, road.halfDepth)
        return Math.max(best, dist < 3.5 ? 1 - Math.max(0, dist) / 3.5 : 0)
      }, 0)
    case 'farm_yard':
      return farmDist < FARM_YARD_RADIUS ? 1 - farmDist / FARM_YARD_RADIUS : 0
    case 'field':
      return fieldCenter ? 1 : 0
    case 'forest':
      return deepForest ? 0.85 + (forestEdgeDist - FOREST_INTERIOR_INSET) * 0.02 : 0
    case 'forest_edge':
      if (insideForest && forestEdgeDist < FOREST_INTERIOR_INSET) {
        return 1 - forestEdgeDist / FOREST_INTERIOR_INSET
      }
      return nearForestEdge ? 1 - forestEdgeDist / FOREST_EDGE_BAND : 0
    case 'meadow':
      if (onRoad || fieldCenter || deepForest) {
        return 0
      }
      return 0.55 + (forestEdgeDist < 12 ? 0.15 : 0)
    default:
      return 0
  }
}

function distanceToFarmHub(x: number, z: number): number {
  const hub = getActiveFarmHub().barn.position
  return Math.hypot(x - hub.x, z - hub.z)
}

export function resolveSpecialLayerBoost(
  context: VegetationPlacementContext,
  x: number,
  z: number,
): Partial<Record<string, number>> {
  const hedgerow = distanceToHedgerow(context, x, z)
  const treeLine = distanceToTreeLine(context, x, z)
  const boosts: Record<string, number> = {}

  if (hedgerow < 2.5) {
    boosts.hedgerow = 1 - hedgerow / 2.5
  }
  if (treeLine < 3.5) {
    boosts.lime = 1 - treeLine / 3.5
  }

  return boosts
}
