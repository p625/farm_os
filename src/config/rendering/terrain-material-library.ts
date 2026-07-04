import type { TerrainMaterialDefinition } from '@/types/terrain-rendering.ts'

const LIBRARY_TEXTURE_ROOT = '/textures/terrain/library'

function libTextures(materialId: string): TerrainMaterialDefinition['textures'] {
  const base = `${LIBRARY_TEXTURE_ROOT}/${materialId}`
  return {
    albedo: `${base}/albedo.webp`,
    normal: `${base}/normal.webp`,
    roughness: `${base}/roughness.webp`,
    ambientOcclusion: `${base}/ao.webp`,
    height: `${base}/height.webp`,
    macroTexture: `${base}/macro.webp`,
    detail: `${base}/detail.webp`,
  }
}

function mat(
  partial: Omit<
    TerrainMaterialDefinition,
    'textures' | 'label' | 'albedo' | 'roughness' | 'metallic' | 'ao' | 'macroColorStrength' | 'macroRoughnessStrength'
  > & {
    tint: readonly [number, number, number]
    roughness: number
    ao?: number
    macroColorStrength?: number
    macroRoughnessStrength?: number
  },
): TerrainMaterialDefinition {
  return {
    ...partial,
    label: partial.displayName,
    textures: libTextures(partial.id),
    albedo: partial.tint,
    metallic: 0,
    ao: partial.ao ?? 1,
    macroColorStrength: partial.macroColorStrength ?? 0.06,
    macroRoughnessStrength: partial.macroRoughnessStrength ?? 0.04,
  }
}

/**
 * Data-driven terrain material library (MS1B).
 * Renderer references only material ids — never raw texture filenames.
 */
export const TERRAIN_MATERIAL_LIBRARY: readonly TerrainMaterialDefinition[] = [
  mat({
    id: 'meadow',
    displayName: 'Louka',
    legacySurfaceId: 0,
    splat: { mapIndex: 1, channel: 'g' },
    tint: [0.34, 0.52, 0.22],
    uvScale: 0.14,
    macroScale: 0.004,
    normalStrength: 0.9,
    roughnessMultiplier: 0.96,
    heightScale: 0.35,
    roughness: 0.94,
    seasonProfile: 'summer',
    weatherProfile: 'dry',
    macroColorStrength: 0.08,
  }),
  mat({
    id: 'grass',
    displayName: 'Krátká tráva',
    splat: { mapIndex: 1, channel: 'r' },
    tint: [0.3, 0.5, 0.2],
    uvScale: 0.18,
    macroScale: 0.005,
    normalStrength: 0.85,
    roughnessMultiplier: 0.95,
    heightScale: 0.3,
    roughness: 0.95,
    seasonProfile: 'summer',
    weatherProfile: 'dry',
  }),
  mat({
    id: 'topsoil',
    displayName: 'Ornice',
    legacySurfaceId: 1,
    splat: { mapIndex: 0, channel: 'r' },
    tint: [0.42, 0.3, 0.18],
    uvScale: 0.22,
    macroScale: 0.0035,
    normalStrength: 1,
    roughnessMultiplier: 0.92,
    heightScale: 0.4,
    roughness: 0.92,
    seasonProfile: 'all',
    weatherProfile: 'all',
  }),
  mat({
    id: 'clay',
    displayName: 'Hlína',
    legacySurfaceId: 3,
    splat: { mapIndex: 0, channel: 'g' },
    tint: [0.4, 0.32, 0.24],
    uvScale: 0.2,
    macroScale: 0.003,
    normalStrength: 0.95,
    roughnessMultiplier: 0.9,
    heightScale: 0.35,
    roughness: 0.9,
    seasonProfile: 'all',
    weatherProfile: 'wet',
  }),
  mat({
    id: 'forest_floor',
    displayName: 'Lesní půda',
    splat: { mapIndex: 2, channel: 'g' },
    tint: [0.24, 0.34, 0.18],
    uvScale: 0.16,
    macroScale: 0.0045,
    normalStrength: 0.95,
    roughnessMultiplier: 0.97,
    heightScale: 0.32,
    roughness: 0.96,
    seasonProfile: 'all',
    weatherProfile: 'dry',
    macroColorStrength: 0.07,
  }),
  mat({
    id: 'gravel',
    displayName: 'Štěrk',
    legacySurfaceId: 2,
    splat: { mapIndex: 0, channel: 'b' },
    tint: [0.48, 0.44, 0.38],
    uvScale: 0.35,
    macroScale: 0.0025,
    normalStrength: 1.15,
    roughnessMultiplier: 0.88,
    heightScale: 0.55,
    roughness: 0.88,
    seasonProfile: 'all',
    weatherProfile: 'dry',
  }),
  mat({
    id: 'asphalt',
    displayName: 'Asfalt',
    splat: { mapIndex: 0, channel: 'a' },
    tint: [0.3, 0.3, 0.32],
    uvScale: 0.5,
    macroScale: 0.002,
    normalStrength: 0.75,
    roughnessMultiplier: 0.78,
    heightScale: 0.15,
    roughness: 0.75,
    seasonProfile: 'all',
    weatherProfile: 'dry',
    macroColorStrength: 0.02,
  }),
  mat({
    id: 'mud',
    displayName: 'Bláto',
    splat: { mapIndex: 1, channel: 'a' },
    tint: [0.34, 0.28, 0.2],
    uvScale: 0.24,
    macroScale: 0.003,
    normalStrength: 0.7,
    roughnessMultiplier: 0.4,
    heightScale: 0.2,
    roughness: 0.35,
    seasonProfile: 'all',
    weatherProfile: 'wet',
    macroRoughnessStrength: 0.1,
  }),
  mat({
    id: 'rock',
    displayName: 'Kameny',
    splat: { mapIndex: 2, channel: 'r' },
    tint: [0.5, 0.48, 0.44],
    uvScale: 0.28,
    macroScale: 0.002,
    normalStrength: 1.25,
    roughnessMultiplier: 0.82,
    heightScale: 0.7,
    roughness: 0.82,
    seasonProfile: 'all',
    weatherProfile: 'dry',
    macroColorStrength: 0.03,
  }),
] as const

export const TERRAIN_MATERIAL_BY_ID = new Map(
  TERRAIN_MATERIAL_LIBRARY.map((material) => [material.id, material]),
)

export const TERRAIN_MATERIAL_BY_LEGACY_SURFACE = new Map(
  TERRAIN_MATERIAL_LIBRARY.filter((m) => m.legacySurfaceId !== undefined).map(
    (m) => [m.legacySurfaceId as number, m],
  ),
)

/** Active shader slots (splat map 0–2 × RGBA, minus unused). */
export const TERRAIN_MATERIAL_SLOT_COUNT = 12
