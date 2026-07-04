import {
  RawTexture,
  Texture,
  type Scene,
  type Texture as BTexture,
} from '@babylonjs/core'
import { TERRAIN_MATERIAL_LIBRARY } from '@/config/rendering/terrain-material-library.ts'
import { TERRAIN_VISUAL_CONFIG } from '@/config/rendering/terrain-visual-config.ts'
import {
  blitTileToAtlas,
  generateTerrainMaterialTile,
} from '@/rendering/terrain/TerrainProceduralTextures.ts'
import { getMaterialSlotIndex, listTerrainMaterials } from '@/rendering/terrain/TerrainMaterialRegistry.ts'

export interface TerrainMaterialAtlases {
  albedo: BTexture
  normalHeight: BTexture
  aoRough: BTexture
  macro: BTexture
  detail: BTexture
  slotUvOffset: Float32Array
  slotUvScale: Float32Array
}

let sharedAtlases: TerrainMaterialAtlases | null = null

function createAtlasRawTexture(
  scene: Scene,
  name: string,
  data: Uint8ClampedArray,
  width: number,
  height: number,
): BTexture {
  const tex = RawTexture.CreateRGBATexture(
    new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width,
    height,
    scene,
    false,
    false,
    Texture.TRILINEAR_SAMPLINGMODE,
  )
  tex.name = name
  tex.wrapU = Texture.WRAP_ADDRESSMODE
  tex.wrapV = Texture.WRAP_ADDRESSMODE
  return tex
}

export function getOrBuildTerrainMaterialAtlases(scene: Scene): TerrainMaterialAtlases {
  if (sharedAtlases) {
    return sharedAtlases
  }

  const { atlasTileSize, atlasColumns, atlasRows } = TERRAIN_VISUAL_CONFIG
  const atlasWidth = atlasTileSize * atlasColumns
  const atlasHeight = atlasTileSize * atlasRows
  const pixelCount = atlasWidth * atlasHeight * 4

  const albedoData = new Uint8ClampedArray(pixelCount)
  const normalHeightData = new Uint8ClampedArray(pixelCount)
  const aoRoughData = new Uint8ClampedArray(pixelCount)
  const macroData = new Uint8ClampedArray(pixelCount)
  const detailData = new Uint8ClampedArray(pixelCount)

  const slotUvOffset = new Float32Array(TERRAIN_MATERIAL_LIBRARY.length * 2)
  const slotUvScale = new Float32Array(TERRAIN_MATERIAL_LIBRARY.length * 2)

  for (const material of listTerrainMaterials()) {
    const slot = getMaterialSlotIndex(material)
    const col = slot % atlasColumns
    const row = Math.floor(slot / atlasColumns)

    slotUvOffset[slot * 2] = col / atlasColumns
    slotUvOffset[slot * 2 + 1] = row / atlasRows
    slotUvScale[slot * 2] = 1 / atlasColumns
    slotUvScale[slot * 2 + 1] = 1 / atlasRows

    const tile = generateTerrainMaterialTile(
      material.id,
      atlasTileSize,
      material.tint,
      material.roughness * material.roughnessMultiplier,
      material.heightScale,
    )

    blitTileToAtlas(albedoData, atlasWidth, atlasTileSize, col, row, tile.albedo, atlasTileSize)
    blitTileToAtlas(normalHeightData, atlasWidth, atlasTileSize, col, row, tile.normalHeight, atlasTileSize)
    blitTileToAtlas(aoRoughData, atlasWidth, atlasTileSize, col, row, tile.aoRough, atlasTileSize)
    blitTileToAtlas(macroData, atlasWidth, atlasTileSize, col, row, tile.macro, atlasTileSize)
    blitTileToAtlas(detailData, atlasWidth, atlasTileSize, col, row, tile.detail, atlasTileSize)
  }

  sharedAtlases = {
    albedo: createAtlasRawTexture(scene, 'farmosTerrainAlbedoAtlas', albedoData, atlasWidth, atlasHeight),
    normalHeight: createAtlasRawTexture(scene, 'farmosTerrainNormalHeightAtlas', normalHeightData, atlasWidth, atlasHeight),
    aoRough: createAtlasRawTexture(scene, 'farmosTerrainAoRoughAtlas', aoRoughData, atlasWidth, atlasHeight),
    macro: createAtlasRawTexture(scene, 'farmosTerrainMacroAtlas', macroData, atlasWidth, atlasHeight),
    detail: createAtlasRawTexture(scene, 'farmosTerrainDetailAtlas', detailData, atlasWidth, atlasHeight),
    slotUvOffset,
    slotUvScale,
  }

  return sharedAtlases
}

export function disposeTerrainMaterialAtlases(): void {
  if (!sharedAtlases) {
    return
  }
  sharedAtlases.albedo.dispose()
  sharedAtlases.normalHeight.dispose()
  sharedAtlases.aoRough.dispose()
  sharedAtlases.macro.dispose()
  sharedAtlases.detail.dispose()
  sharedAtlases = null
}

export function buildTerrainSplatTexture(
  scene: Scene,
  name: string,
  resolution: number,
  weights: Float32Array,
): BTexture {
  const data = new Uint8Array(resolution * resolution * 4)
  for (let i = 0; i < resolution * resolution; i++) {
    const base = i * 4
    data[base] = Math.round(Math.min(1, weights[i * 4]) * 255)
    data[base + 1] = Math.round(Math.min(1, weights[i * 4 + 1]) * 255)
    data[base + 2] = Math.round(Math.min(1, weights[i * 4 + 2]) * 255)
    data[base + 3] = Math.round(Math.min(1, weights[i * 4 + 3]) * 255)
  }

  const tex = RawTexture.CreateRGBATexture(
    data,
    resolution,
    resolution,
    scene,
    false,
    false,
    Texture.BILINEAR_SAMPLINGMODE,
  )
  tex.name = name
  tex.wrapU = Texture.CLAMP_ADDRESSMODE
  tex.wrapV = Texture.CLAMP_ADDRESSMODE
  return tex
}

export function encodeSplatWeightGrid(
  resolution: number,
  surfaces: readonly number[],
  mapIndex: number,
): Float32Array {
  const weights = new Float32Array(resolution * resolution * 4)
  const materials = listTerrainMaterials()

  for (let j = 0; j < resolution; j++) {
    for (let i = 0; i < resolution; i++) {
      const surfaceIndex = j * resolution + i
      const surfaceId = surfaces[surfaceIndex] ?? 0
      const material =
        materials.find((m) => m.legacySurfaceId === surfaceId) ??
        materials.find((m) => m.id === 'meadow')!

      if (material.splat.mapIndex !== mapIndex) {
        continue
      }

      const channel =
        material.splat.channel === 'r' ? 0 : material.splat.channel === 'g' ? 1 : material.splat.channel === 'b' ? 2 : 3
      const pixel = (j * resolution + i) * 4 + channel
      weights[pixel] = 1
    }
  }

  return weights
}
