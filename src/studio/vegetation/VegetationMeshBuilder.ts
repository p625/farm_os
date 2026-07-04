import type { AbstractMesh, Scene } from '@babylonjs/core'
import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'
import type { VegetationTypeDefinition } from '@/studio/vegetation/VegetationTypePalette.ts'
import {
  STUDIO_METADATA_KEY,
  type StudioMeshMetadata,
} from '@/studio/io/MapSceneBuilder.ts'

function rgb(color: readonly [number, number, number]): Color3 {
  return new Color3(color[0], color[1], color[2])
}

function attachMetadata(mesh: AbstractMesh, metadata: StudioMeshMetadata): void {
  mesh.metadata = { [STUDIO_METADATA_KEY]: metadata }
  mesh.isPickable = true
}

function createFoliageMaterial(
  scene: Scene,
  nodeName: string,
  color: Color3,
  preview: boolean,
): StandardMaterial {
  const material = new StandardMaterial(`${nodeName}_foliage_mat`, scene)
  material.diffuseColor = color
  material.specularColor = color.scale(0.1)
  if (preview) {
    material.alpha = 0.55
    material.disableLighting = true
    material.emissiveColor = color.scale(0.25)
  }
  return material
}

function buildGrassPatch(
  root: TransformNode,
  scene: Scene,
  nodeName: string,
  definition: VegetationTypeDefinition,
  metadata: StudioMeshMetadata,
  foliageMat: StandardMaterial,
): void {
  const patchSize = definition.canopyWidth
  const patchHeight = definition.height

  const base = MeshBuilder.CreateBox(
    `${nodeName}_grass_base`,
    { width: patchSize, height: patchHeight * 0.35, depth: patchSize },
    scene,
  )
  base.parent = root
  base.position.y = (patchHeight * 0.35) * 0.5
  base.material = foliageMat
  attachMetadata(base, metadata)

  const bladeCount = 5
  for (let index = 0; index < bladeCount; index++) {
    const angle = (index / bladeCount) * Math.PI * 2
    const radius = patchSize * 0.22
    const blade = MeshBuilder.CreateBox(
      `${nodeName}_grass_blade_${index}`,
      {
        width: patchSize * 0.12,
        height: patchHeight,
        depth: patchSize * 0.08,
      },
      scene,
    )
    blade.parent = root
    blade.position = new Vector3(
      Math.cos(angle) * radius,
      patchHeight * 0.5,
      Math.sin(angle) * radius,
    )
    blade.rotation.y = angle
    blade.rotation.x = ((index % 3) - 1) * 0.08
    blade.material = foliageMat
    attachMetadata(blade, metadata)
  }
}

export function createVegetationPlaceholder(
  scene: Scene,
  nodeName: string,
  definition: VegetationTypeDefinition,
  metadata: StudioMeshMetadata,
  options?: { preview?: boolean },
): TransformNode {
  const root = new TransformNode(nodeName, scene)
  const preview = options?.preview ?? false
  const foliageColor = rgb(definition.foliageColor)
  const foliageMat = createFoliageMaterial(scene, nodeName, foliageColor, preview)

  if (definition.kind === 'grass') {
    buildGrassPatch(root, scene, nodeName, definition, metadata, foliageMat)
    return root
  }

  if (definition.kind === 'shrub') {
    const shrub = MeshBuilder.CreateSphere(
      `${nodeName}_shrub`,
      { diameter: 1, segments: 10 },
      scene,
    )
    shrub.parent = root
    const scaleX = definition.canopyWidth
    const scaleY = definition.height
    const scaleZ = definition.canopyWidth
    shrub.scaling = new Vector3(scaleX, scaleY, scaleZ)
    shrub.position.y = definition.height * 0.5
    shrub.material = foliageMat
    attachMetadata(shrub, metadata)
    return root
  }

  const trunkHeight = definition.height * 0.4
  const foliageHeight = definition.height - trunkHeight
  const trunkRadius = Math.max(0.12, definition.canopyWidth * 0.06)

  const trunk = MeshBuilder.CreateCylinder(
    `${nodeName}_trunk`,
    { height: trunkHeight, diameter: trunkRadius * 2, tessellation: 8 },
    scene,
  )
  trunk.parent = root
  trunk.position.y = trunkHeight * 0.5

  const trunkMat = new StandardMaterial(`${nodeName}_trunk_mat`, scene)
  const trunkColor = rgb(definition.trunkColor)
  trunkMat.diffuseColor = trunkColor
  trunkMat.specularColor = trunkColor.scale(0.08)
  if (preview) {
    trunkMat.alpha = 0.55
    trunkMat.disableLighting = true
  }
  trunk.material = trunkMat
  attachMetadata(trunk, metadata)

  const canopy = MeshBuilder.CreateSphere(
    `${nodeName}_canopy`,
    { diameter: 1, segments: 10 },
    scene,
  )
  canopy.parent = root
  canopy.scaling = new Vector3(
    definition.canopyWidth,
    foliageHeight,
    definition.canopyWidth,
  )
  canopy.position.y = trunkHeight + foliageHeight * 0.5
  canopy.material = foliageMat
  attachMetadata(canopy, metadata)

  return root
}

export function positionVegetationRoot(
  root: TransformNode,
  position: { x: number; y: number; z: number },
  rotationY: number,
): void {
  root.position = new Vector3(position.x, position.y, position.z)
  root.rotation.y = rotationY
}

export function disposeVegetationNode(scene: Scene, objectId: string): void {
  const node = scene.getTransformNodeByName(`studio_${objectId}`)
  node?.dispose(false, true)
}
