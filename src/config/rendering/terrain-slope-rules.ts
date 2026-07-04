import type { TerrainSlopeEvaluation, TerrainSlopeRule } from '@/types/terrain-rendering.ts'
import { TERRAIN_VISUAL_CONFIG } from '@/config/rendering/terrain-visual-config.ts'
import { getTerrainMaterial } from '@/rendering/terrain/TerrainMaterialRegistry.ts'

export const TERRAIN_SLOPE_RULES: readonly TerrainSlopeRule[] = [
  {
    id: 'flat_grass',
    materialId: TERRAIN_VISUAL_CONFIG.slopeRules.grassMaterialId,
    minSlope: 0,
    maxSlope: TERRAIN_VISUAL_CONFIG.slopeRules.grassMaxSlope,
    blendWeight: 1,
  },
  {
    id: 'steep_rock',
    materialId: TERRAIN_VISUAL_CONFIG.slopeRules.steepMaterialId,
    minSlope: TERRAIN_VISUAL_CONFIG.slopeRules.rockMinSlope,
    maxSlope: TERRAIN_VISUAL_CONFIG.slopeRules.rockMaxSlope,
    blendWeight: 1,
  },
] as const

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** Slope factor from terrain normal (0 = flat, 1 = vertical). */
export function computeTerrainSlope(normalY: number): number {
  return 1 - Math.max(0, Math.min(1, normalY))
}

export function evaluateTerrainSlopeRules(
  normalY: number,
  rules: readonly TerrainSlopeRule[] = TERRAIN_SLOPE_RULES,
): TerrainSlopeEvaluation {
  const slope = computeTerrainSlope(normalY)
  const weights: Record<string, number> = {}

  for (const rule of rules) {
    const material = getTerrainMaterial(rule.materialId)
    if (!material) {
      continue
    }
    const t = smoothstep(rule.minSlope, rule.maxSlope, slope)
    const w = (1 - Math.abs(t - 0.5) * 2) * rule.blendWeight
    if (w > 0.001) {
      weights[rule.materialId] = (weights[rule.materialId] ?? 0) + w
    }
  }

  if (TERRAIN_VISUAL_CONFIG.slopeRules.enabled) {
    const rockW = smoothstep(
      TERRAIN_VISUAL_CONFIG.slopeRules.rockMinSlope,
      TERRAIN_VISUAL_CONFIG.slopeRules.rockMaxSlope,
      slope,
    )
    if (rockW > 0.001) {
      weights[TERRAIN_VISUAL_CONFIG.slopeRules.steepMaterialId] = rockW
    }
  }

  return { slope, weights }
}
