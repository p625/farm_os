import {
  Color3,
  Effect,
  Vector3,
  type AbstractMesh,
  type Mesh,
  type Observer,
  type Scene,
  ShaderMaterial,
  type Texture,
} from '@babylonjs/core'
import { TERRAIN_VISUAL_CONFIG } from '@/config/rendering/terrain-visual-config.ts'
import { TERRAIN_PIPELINE_CONFIG } from '@/config/rendering/terrain-pipeline-config.ts'
import {
  getMaterialSlotIndex,
  listTerrainMaterials,
} from '@/rendering/terrain/TerrainMaterialRegistry.ts'
import { getActiveTerrainShaderDefines } from '@/rendering/terrain/TerrainLayerStack.ts'
import {
  getOrBuildTerrainMaterialAtlases,
  type TerrainMaterialAtlases,
} from '@/rendering/terrain/TerrainTextureLibrary.ts'
import {
  FARMOS_TERRAIN_FRAGMENT_SHADER,
  FARMOS_TERRAIN_VERTEX_SHADER,
} from '@/rendering/terrain/shaders/terrainShaderSources.ts'

const SHADER_BASE_NAME = TERRAIN_PIPELINE_CONFIG.shaderName
const SLOT_COUNT = 12

let shadersRegistered = false
const materialObservers = new WeakMap<ShaderMaterial, Observer<Scene>>()

function shaderStoreKey(suffix: 'Vertex' | 'Fragment'): string {
  return `${SHADER_BASE_NAME}${suffix}Shader`
}

export function ensureTerrainShadersRegistered(): void {
  if (shadersRegistered) {
    return
  }
  Effect.ShadersStore[shaderStoreKey('Vertex')] = FARMOS_TERRAIN_VERTEX_SHADER
  Effect.ShadersStore[shaderStoreKey('Fragment')] = FARMOS_TERRAIN_FRAGMENT_SHADER
  shadersRegistered = true
}

export interface TerrainSplatTextureSet {
  map0: Texture | null
  map1: Texture | null
  map2: Texture | null
}

export function createTerrainShaderMaterial(
  scene: Scene,
  name: string,
  splatTextures?: TerrainSplatTextureSet,
): ShaderMaterial {
  ensureTerrainShadersRegistered()

  const material = new ShaderMaterial(
    name,
    scene,
    { vertex: SHADER_BASE_NAME, fragment: SHADER_BASE_NAME },
    {
      attributes: ['position', 'normal', 'uv', 'color', 'uv2'],
      uniforms: [
        'world',
        'worldViewProjection',
        'uUseSplatTextures',
        'uHeightBlendEnabled',
        'uHeightBlendSharpness',
        'uSplatSoftness',
        'uMacroEnabled',
        'uMacroColorStrength',
        'uMacroRoughStrength',
        'uMacroNormalStrength',
        'uDetailEnabled',
        'uDetailUvScale',
        'uDetailNormalStrength',
        'uDetailFadeStart',
        'uDetailFadeEnd',
        'uAntiTileEnabled',
        'uAntiTileRotation',
        'uAntiTileOffset',
        'uSlopeRulesEnabled',
        'uRockMinSlope',
        'uRockMaxSlope',
        'uRockSlot',
        'uWarmth',
        'uGreenBias',
        'uSaturation',
        'uContrast',
        'uBrightness',
        'uShadowLift',
        'uEmissiveBoost',
        'uCameraPosition',
        'uLightDirection',
        'uLightColor',
        'uAmbientColor',
        'uSlotUvScales',
        'uSlotNormalStrength',
        'uSlotRoughMul',
        'uSlotMacroScale',
        'uSlotUvOffset',
        'uSlotUvScale',
      ],
      samplers: [
        'uAlbedoAtlas',
        'uNormalHeightAtlas',
        'uAoRoughAtlas',
        'uMacroAtlas',
        'uDetailAtlas',
        'uSplatMap0',
        'uSplatMap1',
        'uSplatMap2',
      ],
      defines: getActiveTerrainShaderDefines(),
    },
  )

  material.backFaceCulling = true
  bindTerrainMaterialTextures(material, scene, splatTextures)
  applyTerrainShaderUniforms(material, scene)
  attachCameraUniformSync(material, scene)
  return material
}

function attachCameraUniformSync(material: ShaderMaterial, scene: Scene): void {
  const existing = materialObservers.get(material)
  existing?.remove()

  const observer = scene.onBeforeRenderObservable.add(() => {
    const camera = scene.activeCamera
    if (!camera) {
      return
    }
    material.setVector3('uCameraPosition', camera.globalPosition)
  })
  materialObservers.set(material, observer)
}

export function bindTerrainMaterialTextures(
  material: ShaderMaterial,
  scene: Scene,
  splatTextures?: TerrainSplatTextureSet,
): void {
  const atlases = getOrBuildTerrainMaterialAtlases(scene)
  material.setTexture('uAlbedoAtlas', atlases.albedo)
  material.setTexture('uNormalHeightAtlas', atlases.normalHeight)
  material.setTexture('uAoRoughAtlas', atlases.aoRough)
  material.setTexture('uMacroAtlas', atlases.macro)
  material.setTexture('uDetailAtlas', atlases.detail)

  const hasSplat =
    splatTextures?.map0 && splatTextures?.map1 && splatTextures?.map2
  material.setFloat('uUseSplatTextures', hasSplat ? 1 : 0)

  if (hasSplat && splatTextures) {
    material.setTexture('uSplatMap0', splatTextures.map0!)
    material.setTexture('uSplatMap1', splatTextures.map1!)
    material.setTexture('uSplatMap2', splatTextures.map2!)
  }
}

export function applyTerrainShaderUniforms(material: ShaderMaterial, scene: Scene): void {
  const atlases = getOrBuildTerrainMaterialAtlases(scene)
  applyAtlasSlotUniforms(material, atlases)

  const visual = TERRAIN_VISUAL_CONFIG
  const macro = TERRAIN_PIPELINE_CONFIG.macroVariation
  const grade = TERRAIN_PIPELINE_CONFIG.colorGrading

  material.setFloat('uHeightBlendEnabled', visual.heightBlend.enabled ? 1 : 0)
  material.setFloat('uHeightBlendSharpness', visual.heightBlend.sharpness)
  material.setFloat('uSplatSoftness', visual.splatSoftness)
  material.setFloat('uMacroEnabled', macro.enabled ? 1 : 0)
  material.setFloat('uMacroColorStrength', macro.colorStrength)
  material.setFloat('uMacroRoughStrength', macro.roughnessStrength)
  material.setFloat('uMacroNormalStrength', macro.normalStrength)
  material.setFloat('uDetailEnabled', visual.detail.enabled ? 1 : 0)
  material.setFloat('uDetailUvScale', visual.detail.uvScale)
  material.setFloat('uDetailNormalStrength', visual.detail.normalStrength)
  material.setFloat('uDetailFadeStart', visual.detail.fadeStart)
  material.setFloat('uDetailFadeEnd', visual.detail.fadeEnd)
  material.setFloat('uAntiTileEnabled', visual.antiTiling.enabled ? 1 : 0)
  material.setFloat('uAntiTileRotation', visual.antiTiling.rotationStrength)
  material.setFloat('uAntiTileOffset', visual.antiTiling.offsetStrength)
  material.setFloat('uSlopeRulesEnabled', visual.slopeRules.enabled ? 1 : 0)
  material.setFloat('uRockMinSlope', visual.slopeRules.rockMinSlope)
  material.setFloat('uRockMaxSlope', visual.slopeRules.rockMaxSlope)

  const rockMaterial = listTerrainMaterials().find((m) => m.id === visual.slopeRules.steepMaterialId)
  material.setFloat('uRockSlot', rockMaterial ? getMaterialSlotIndex(rockMaterial) : 8)

  material.setFloat('uWarmth', visual.warmth)
  material.setFloat('uGreenBias', visual.greenBias)
  material.setFloat('uSaturation', grade.saturation)
  material.setFloat('uContrast', grade.contrast)
  material.setFloat('uBrightness', grade.brightness)
  material.setFloat('uShadowLift', grade.shadowLift)
  material.setFloat('uEmissiveBoost', 0.015)

  material.setVector3('uLightDirection', new Vector3(0.65, 1.2, 0.45))
  material.setColor3('uLightColor', new Color3(1, 0.96, 0.86))
  material.setColor3('uAmbientColor', scene.ambientColor ?? new Color3(0.35, 0.38, 0.32))

  const camera = scene.activeCamera
  if (camera) {
    material.setVector3('uCameraPosition', camera.globalPosition)
  }
}

function applyAtlasSlotUniforms(material: ShaderMaterial, atlases: TerrainMaterialAtlases): void {
  const uvScales = new Array<number>(SLOT_COUNT).fill(0.15)
  const normalStrength = new Array<number>(SLOT_COUNT).fill(1)
  const roughMul = new Array<number>(SLOT_COUNT).fill(1)
  const macroScale = new Array<number>(SLOT_COUNT).fill(0.004)

  for (const m of listTerrainMaterials()) {
    const slot = getMaterialSlotIndex(m)
    uvScales[slot] = m.uvScale
    normalStrength[slot] = m.normalStrength
    roughMul[slot] = m.roughnessMultiplier
    macroScale[slot] = m.macroScale
  }

  material.setFloats('uSlotUvScales', uvScales)
  material.setFloats('uSlotNormalStrength', normalStrength)
  material.setFloats('uSlotRoughMul', roughMul)
  material.setFloats('uSlotMacroScale', macroScale)
  material.setFloats('uSlotUvOffset', Array.from(atlases.slotUvOffset))
  material.setFloats('uSlotUvScale', Array.from(atlases.slotUvScale))
}

export function isTerrainShaderMaterial(
  material: AbstractMesh['material'],
): material is ShaderMaterial {
  return material instanceof ShaderMaterial && material.name.includes('terrain')
}

export function setTerrainPreviewEmissive(mesh: Mesh, active: boolean): void {
  const material = mesh.material
  if (!(material instanceof ShaderMaterial)) {
    return
  }
  material.setFloat('uEmissiveBoost', active ? 0.04 : 0.015)
}

export function syncTerrainShaderLighting(scene: Scene, lightDirection?: Vector3): void {
  const dir = lightDirection ?? new Vector3(0.65, 1.2, 0.45)
  for (const material of scene.materials) {
    if (!(material instanceof ShaderMaterial) || !material.name.includes('terrain')) {
      continue
    }
    material.setVector3('uLightDirection', dir)
    if (scene.ambientColor) {
      material.setColor3('uAmbientColor', scene.ambientColor)
    }
  }
}

export function disposeTerrainShaderMaterial(material: ShaderMaterial): void {
  const observer = materialObservers.get(material)
  observer?.remove()
  materialObservers.delete(material)
}
