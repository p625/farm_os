export {
  applyTerrainPipelineMaterial,
  createTerrainGroundMesh,
  prepareTerrainMeshForPipeline,
  setTerrainMeshPreviewTint,
  syncTerrainMeshPipeline,
  type TerrainGroundBuildOptions,
} from './TerrainRenderPipeline.ts'
export { resolveTerrainLod } from './TerrainLodPolicy.ts'
export {
  buildSplatMapDescriptors,
  getTerrainMaterial,
  getTerrainMaterialForLegacySurface,
  listTerrainMaterials,
} from './TerrainMaterialRegistry.ts'
export { evaluateTerrainSlopeRules, computeTerrainSlope } from '@/config/rendering/terrain-slope-rules.ts'
export { getOrBuildTerrainMaterialAtlases } from './TerrainTextureLibrary.ts'
export { getTerrainLayerStack, isTerrainLayerEnabled } from './TerrainLayerStack.ts'
export {
  createTerrainShaderMaterial,
  ensureTerrainShadersRegistered,
  syncTerrainShaderLighting,
} from './TerrainShaderFramework.ts'
