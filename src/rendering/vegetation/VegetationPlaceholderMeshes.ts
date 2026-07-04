import {
  Color3,
  Matrix,
  Mesh,
  MeshBuilder,
  Quaternion,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'
import { VEGETATION_BIOME_CONFIG } from '@/config/rendering/vegetation/vegetation-biome-config.ts'
import { VEGETATION_CONFIG } from '@/config/rendering/vegetation/vegetation-config.ts'
import type { VegetationLayerDefinition } from '@/types/vegetation-rendering.ts'

export interface VegetationPlaceholderMeshes {
  root: TransformNode
  mesh: Mesh
  material: StandardMaterial
}

function rgb(color: readonly [number, number, number]): Color3 {
  return new Color3(color[0], color[1], color[2])
}

function createPlaceholderMaterial(
  scene: Scene,
  layer: VegetationLayerDefinition,
  baseColor: Color3,
): StandardMaterial {
  const material = new StandardMaterial(`farmos_veg_mat_${layer.id}`, scene)
  material.diffuseColor = baseColor
  material.specularColor = baseColor.scale(0.08)
  material.ambientColor = baseColor.scale(0.35)
  material.metadata = {
    farmosVegetationPlaceholder: true,
    layerId: layer.id,
    placeholderLabel: VEGETATION_CONFIG.placeholderLabel,
  }
  return material
}

function resolveBaseColor(layer: VegetationLayerDefinition): Color3 {
  const palette = VEGETATION_BIOME_CONFIG.palette
  switch (layer.type) {
    case 'short_grass':
    case 'roadside_grass':
      return rgb(palette.grass)
    case 'meadow_grass':
      return rgb(palette.meadow)
    case 'field_margin':
      return rgb(palette.dryGrass)
    case 'shrub':
    case 'hedgerow':
    case 'forest_edge':
      return rgb(palette.shrub)
    case 'tree_line':
    case 'scattered_tree':
      return rgb(palette.tree)
    default:
      return rgb(palette.grass)
  }
}

function buildGrassMesh(scene: Scene, layer: VegetationLayerDefinition, tall: boolean): Mesh {
  const height = tall ? 0.42 : 0.14
  const width = tall ? 0.18 : 0.12
  const mesh = MeshBuilder.CreateBox(
    `farmos_veg_src_${layer.id}`,
    { width, height, depth: width * 0.7 },
    scene,
  )
  mesh.position.y = height * 0.5
  return mesh
}

function buildShrubMesh(scene: Scene, layer: VegetationLayerDefinition, large: boolean): Mesh {
  const mesh = MeshBuilder.CreateSphere(
    `farmos_veg_src_${layer.id}`,
    { diameter: 1, segments: large ? 10 : 8 },
    scene,
  )
  const scale = large ? 2.2 : 1.4
  mesh.scaling = new Vector3(scale, scale * 0.85, scale)
  mesh.position.y = scale * 0.42
  return mesh
}

function buildTreeMesh(scene: Scene, layer: VegetationLayerDefinition): Mesh {
  const root = new TransformNode(`farmos_veg_src_tree_${layer.id}`, scene)
  const trunkHeight = 2.2
  const trunk = MeshBuilder.CreateCylinder(
    `farmos_veg_src_${layer.id}_trunk`,
    { height: trunkHeight, diameter: 0.35, tessellation: 8 },
    scene,
  )
  trunk.parent = root
  trunk.position.y = trunkHeight * 0.5

  const canopy = MeshBuilder.CreateSphere(
    `farmos_veg_src_${layer.id}_canopy`,
    { diameter: 1, segments: 10 },
    scene,
  )
  canopy.parent = root
  canopy.scaling = new Vector3(3.8, 2.8, 3.8)
  canopy.position.y = trunkHeight + 1.2

  const merged = Mesh.MergeMeshes([trunk, canopy], true, true, undefined, false, true)
  if (!merged) {
    throw new Error(`Failed to build placeholder tree mesh for ${layer.id}`)
  }
  merged.name = `farmos_veg_src_${layer.id}`
  root.dispose()
  return merged
}

export function createVegetationPlaceholderMesh(
  scene: Scene,
  layer: VegetationLayerDefinition,
): VegetationPlaceholderMeshes {
  const root = new TransformNode(`farmos_veg_layer_${layer.id}`, scene)
  const baseColor = resolveBaseColor(layer)
  const material = createPlaceholderMaterial(scene, layer, baseColor)

  let mesh: Mesh
  switch (layer.materialProfile.placeholderAssetId) {
    case 'placeholder_meadow_grass':
      mesh = buildGrassMesh(scene, layer, true)
      break
    case 'placeholder_shrub_small':
      mesh = buildShrubMesh(scene, layer, false)
      break
    case 'placeholder_shrub_large':
    case 'placeholder_forest_edge':
      mesh = buildShrubMesh(scene, layer, true)
      break
    case 'placeholder_young_tree':
      mesh = buildTreeMesh(scene, layer)
      break
    case 'placeholder_dry_grass':
      mesh = buildGrassMesh(scene, layer, false)
      material.diffuseColor = rgb(VEGETATION_BIOME_CONFIG.palette.dryGrass)
      break
    case 'placeholder_short_grass':
    default:
      mesh = buildGrassMesh(scene, layer, false)
      break
  }

  mesh.parent = root
  mesh.material = material
  mesh.name = `farmos_veg_src_${layer.id}`
  mesh.metadata = {
    farmosVegetationPlaceholder: true,
    layerId: layer.id,
    placeholderLabel: VEGETATION_CONFIG.placeholderLabel,
  }
  mesh.receiveShadows = layer.materialProfile.receiveShadows
  mesh.isPickable = false
  mesh.alwaysSelectAsActiveMesh = false
  mesh.doNotSyncBoundingInfo = true

  return { root, mesh, material }
}

export function tintVegetationColor(
  base: Color3,
  tint: number,
  variation: VegetationLayerDefinition['colorVariation'],
): Color3 {
  const clamped = Math.max(-1, Math.min(1, tint))
  return new Color3(
    Math.min(VEGETATION_BIOME_CONFIG.summerSaturationCap, base.r + clamped * variation.brightnessShift),
    Math.min(VEGETATION_BIOME_CONFIG.summerSaturationCap, base.g + clamped * variation.saturationShift),
    Math.min(VEGETATION_BIOME_CONFIG.summerSaturationCap, base.b + clamped * variation.hueShift),
  )
}

export function composeInstanceMatrix(
  instance: {
    x: number
    y: number
    z: number
    rotationY: number
    uniformScale: number
  },
): Float32Array {
  const position = new Vector3(instance.x, instance.y, instance.z)
  const rotation = Quaternion.RotationYawPitchRoll(instance.rotationY, 0, 0)
  const scale = new Vector3(instance.uniformScale, instance.uniformScale, instance.uniformScale)
  const matrix = Matrix.Compose(scale, rotation, position)
  const buffer = new Float32Array(16)
  matrix.copyToArray(buffer, 0)
  return buffer
}
