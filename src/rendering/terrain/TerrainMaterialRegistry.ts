import {
  TERRAIN_MATERIAL_BY_ID,
  TERRAIN_MATERIAL_BY_LEGACY_SURFACE,
  TERRAIN_MATERIAL_LIBRARY,
} from '@/config/rendering/terrain-material-library.ts'
import { TERRAIN_PIPELINE_CONFIG } from '@/config/rendering/terrain-pipeline-config.ts'
import type {
  TerrainMaterialDefinition,
  TerrainSplatChannel,
  TerrainSplatMapDescriptor,
} from '@/types/terrain-rendering.ts'

const CHANNEL_INDEX: Record<TerrainSplatChannel, number> = {
  r: 0,
  g: 1,
  b: 2,
  a: 3,
}

export function getTerrainMaterial(id: string): TerrainMaterialDefinition | undefined {
  return TERRAIN_MATERIAL_BY_ID.get(id)
}

export function getTerrainMaterialForLegacySurface(
  surfaceId: number,
): TerrainMaterialDefinition {
  return (
    TERRAIN_MATERIAL_BY_LEGACY_SURFACE.get(surfaceId) ??
    TERRAIN_MATERIAL_LIBRARY[0]
  )
}

export function listTerrainMaterials(): readonly TerrainMaterialDefinition[] {
  return TERRAIN_MATERIAL_LIBRARY
}

export function buildSplatMapDescriptors(): TerrainSplatMapDescriptor[] {
  const mapCount = TERRAIN_PIPELINE_CONFIG.splat.mapCount
  const descriptors: TerrainSplatMapDescriptor[] = []

  for (let index = 0; index < mapCount; index++) {
    descriptors.push({
      index,
      label: `splat_${index}`,
      channels: {},
    })
  }

  for (const material of TERRAIN_MATERIAL_LIBRARY) {
    const descriptor = descriptors[material.splat.mapIndex]
    if (!descriptor) {
      continue
    }
    descriptor.channels[material.splat.channel] = material.id
  }

  return descriptors
}

export function getMaterialSlotIndex(material: TerrainMaterialDefinition): number {
  return material.splat.mapIndex * 4 + CHANNEL_INDEX[material.splat.channel]
}

export interface TerrainMaterialUniformPack {
  albedo: Float32Array
  roughness: Float32Array
  metallic: Float32Array
  ao: Float32Array
  slotCount: number
}

export function packTerrainMaterialUniforms(): TerrainMaterialUniformPack {
  const slotCount = TERRAIN_PIPELINE_CONFIG.splat.mapCount * 4
  const albedo = new Float32Array(slotCount * 3)
  const roughness = new Float32Array(slotCount)
  const metallic = new Float32Array(slotCount)
  const ao = new Float32Array(slotCount)

  for (const material of TERRAIN_MATERIAL_LIBRARY) {
    const slot = getMaterialSlotIndex(material)
    albedo[slot * 3] = material.albedo[0]
    albedo[slot * 3 + 1] = material.albedo[1]
    albedo[slot * 3 + 2] = material.albedo[2]
    roughness[slot] = material.roughness
    metallic[slot] = material.metallic
    ao[slot] = material.ao
  }

  return { albedo, roughness, metallic, ao, slotCount }
}
