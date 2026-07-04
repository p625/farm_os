import {
  getEnvironmentAsset,
  getEnvironmentClusterProfile,
  getEnvironmentDensityProfile,
  pickRandomVariant,
} from '@/config/environment/index.ts'
import type { EnvironmentBiomeDefinition, EnvironmentPlacementInstance, EnvironmentBiomeId } from '@/types/environment-art.ts'
import type { VegetationLayerType } from '@/types/vegetation-rendering.ts'
import {
  accumulateColorStats,
  createEmptyColorStats,
  resolveInstanceColor,
} from '@/rendering/environment/EnvironmentColorVariation.ts'
import {
  evaluateEcologyDensityMultiplier,
  shouldRejectByEcology,
} from '@/rendering/environment/EnvironmentEcologyResolver.ts'
import { resolveSpecialLayerBoost, sampleBiomeAt } from '@/rendering/environment/EnvironmentBiomeSampler.ts'
import type { VegetationPlacementContext } from '@/types/vegetation-rendering.ts'
import { isInsideRoad } from '@/rendering/vegetation/VegetationPlacementRules.ts'

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), state | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface ClusterPlacementAccumulator {
  instances: EnvironmentPlacementInstance[]
  clusterCount: number
  assetCounts: Record<string, number>
  activeBiomes: Set<EnvironmentBiomeId>
  colorStats: ReturnType<typeof createEmptyColorStats>
}

export function createClusterPlacementAccumulator(): ClusterPlacementAccumulator {
  return {
    instances: [],
    clusterCount: 0,
    assetCounts: {},
    activeBiomes: new Set(),
    colorStats: createEmptyColorStats(),
  }
}

export function scatterClustersForBiome(
  biome: EnvironmentBiomeDefinition,
  context: VegetationPlacementContext,
  globalDensityMultiplier: number,
  seed: number,
  accumulator: ClusterPlacementAccumulator,
): void {
  const clusterProfile = getEnvironmentClusterProfile(biome.clusterProfile)
  const densityProfile = getEnvironmentDensityProfile(biome.densityProfile)
  const rand = mulberry32(seed ^ hashString(biome.id))
  const spacing =
    clusterProfile.spacing / Math.sqrt(densityProfile.clusterMultiplier * globalDensityMultiplier)

  for (let x = context.worldMinX; x < context.worldMaxX; x += spacing) {
    for (let z = context.worldMinZ; z < context.worldMaxZ; z += spacing) {
      const jitterX = x + (rand() - 0.5) * spacing * 0.75
      const jitterZ = z + (rand() - 0.5) * spacing * 0.75

      if (rand() < clusterProfile.gapProbability) {
        continue
      }

      const sampledBiome = sampleBiomeAt(context, jitterX, jitterZ)
      if (sampledBiome.id !== biome.id) {
        continue
      }

      if (biome.id !== 'roadside' && isInsideRoad(context, jitterX, jitterZ, 0.4)) {
        continue
      }

      placeCluster(
        biome,
        clusterProfile.minInstances,
        clusterProfile.maxInstances,
        clusterProfile.radius,
        jitterX,
        jitterZ,
        context,
        densityProfile.multiplier * globalDensityMultiplier,
        rand,
        accumulator,
      )
    }
  }
}

function placeCluster(
  biome: EnvironmentBiomeDefinition,
  minInstances: number,
  maxInstances: number,
  radius: number,
  centerX: number,
  centerZ: number,
  context: VegetationPlacementContext,
  densityMultiplier: number,
  rand: () => number,
  accumulator: ClusterPlacementAccumulator,
): void {
  const instanceCount =
    minInstances + Math.floor(rand() * (maxInstances - minInstances + 1) * Math.min(1.2, densityMultiplier))
  if (instanceCount <= 0) {
    return
  }

  accumulator.clusterCount += 1
  accumulator.activeBiomes.add(biome.id)
  const clusterId = `${biome.id}_${accumulator.clusterCount}`
  const specialBoosts = resolveSpecialLayerBoost(context, centerX, centerZ)
  const ecologyContext = { placedInstances: accumulator.instances }

  for (let index = 0; index < instanceCount; index += 1) {
    const angle = rand() * Math.PI * 2
    const dist = Math.sqrt(rand()) * radius
    const x = centerX + Math.cos(angle) * dist
    const z = centerZ + Math.sin(angle) * dist

    const asset = pickWeightedAsset(biome, specialBoosts, rand)
    if (!asset) {
      continue
    }

    const ecologyMultiplier = evaluateEcologyDensityMultiplier(
      biome.id,
      asset.category,
      x,
      z,
      ecologyContext,
    )
    if (rand() > ecologyMultiplier * densityMultiplier) {
      continue
    }
    if (shouldRejectByEcology(biome.id, asset.category, x, z, ecologyContext)) {
      continue
    }

    const variant = pickRandomVariant(asset, rand)
    const color = resolveInstanceColor(asset, biome.colorVariation, rand, variant.colorTintOffset)
    accumulateColorStats(accumulator.colorStats, color)

    const scale =
      (asset.minScale + rand() * (asset.maxScale - asset.minScale)) * variant.scaleMultiplier
    const rotationY = rand() * asset.rotationVariance

    const instance: EnvironmentPlacementInstance = {
      x,
      y: sampleGroundY(x, z, asset.vegetationLayer),
      z,
      rotationY,
      uniformScale: scale,
      colorTint: color.colorTint,
      colorRgb: color.colorRgb,
      assetId: asset.id,
      variantId: variant.id,
      biomeId: biome.id,
      clusterId,
      vegetationLayer: asset.vegetationLayer,
    }

    accumulator.instances.push(instance)
    accumulator.assetCounts[asset.id] = (accumulator.assetCounts[asset.id] ?? 0) + 1
  }
}

function pickWeightedAsset(
  biome: EnvironmentBiomeDefinition,
  specialBoosts: Partial<Record<string, number>>,
  rand: () => number,
): ReturnType<typeof getEnvironmentAsset> {
  let total = 0
  const weights: Array<{ assetId: string; weight: number }> = []

  for (const layer of biome.vegetationLayers) {
    if (!biome.allowedAssets.includes(layer.assetId)) {
      continue
    }
    const asset = getEnvironmentAsset(layer.assetId)
    if (!asset?.enabled) {
      continue
    }
    const boost = specialBoosts[layer.assetId] ?? 1
    const weight = layer.weight * boost
    if (weight <= 0) {
      continue
    }
    weights.push({ assetId: layer.assetId, weight })
    total += weight
  }

  if (total <= 0) {
    return undefined
  }

  let roll = rand() * total
  for (const entry of weights) {
    roll -= entry.weight
    if (roll <= 0) {
      return getEnvironmentAsset(entry.assetId)
    }
  }

  return getEnvironmentAsset(weights[weights.length - 1].assetId)
}

function sampleGroundY(_x: number, _z: number, layer: VegetationLayerType): number {
  return layer.includes('tree') || layer === 'shrub' || layer === 'hedgerow' ? 0.02 : 0
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

export function groupInstancesByLayer(
  instances: readonly EnvironmentPlacementInstance[],
): Record<VegetationLayerType, EnvironmentPlacementInstance[]> {
  const grouped: Record<VegetationLayerType, EnvironmentPlacementInstance[]> = {
    short_grass: [],
    meadow_grass: [],
    field_margin: [],
    roadside_grass: [],
    shrub: [],
    hedgerow: [],
    forest_edge: [],
    tree_line: [],
    scattered_tree: [],
  }

  for (const instance of instances) {
    grouped[instance.vegetationLayer].push(instance)
  }

  return grouped
}
