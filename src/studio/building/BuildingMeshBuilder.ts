import type { AbstractMesh, Scene } from '@babylonjs/core'
import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'
import type { BuildingTypeDefinition } from '@/studio/building/BuildingTypePalette.ts'
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

function makeMaterial(
  scene: Scene,
  name: string,
  color: Color3,
  preview: boolean,
): StandardMaterial {
  const material = new StandardMaterial(name, scene)
  material.diffuseColor = color
  material.specularColor = color.scale(0.12)
  if (preview) {
    material.alpha = 0.55
    material.disableLighting = true
    material.emissiveColor = color.scale(0.2)
  }
  return material
}

function addBox(
  root: TransformNode,
  scene: Scene,
  name: string,
  size: { width: number; height: number; depth: number },
  position: Vector3,
  material: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  const mesh = MeshBuilder.CreateBox(name, size, scene)
  mesh.parent = root
  mesh.position = position
  mesh.material = material
  attachMetadata(mesh, metadata)
}

function addGableRoof(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  width: number,
  depth: number,
  baseY: number,
  roofHeight: number,
  material: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  const slopeDepth = depth * 0.52
  const left = MeshBuilder.CreateBox(
    `${prefix}_roof_l`,
    { width, height: roofHeight, depth: slopeDepth },
    scene,
  )
  left.parent = root
  left.position = new Vector3(0, baseY + roofHeight * 0.5, -depth * 0.18)
  left.rotation.x = -0.42
  left.material = material
  attachMetadata(left, metadata)

  const right = MeshBuilder.CreateBox(
    `${prefix}_roof_r`,
    { width, height: roofHeight, depth: slopeDepth },
    scene,
  )
  right.parent = root
  right.position = new Vector3(0, baseY + roofHeight * 0.5, depth * 0.18)
  right.rotation.x = 0.42
  right.material = material
  attachMetadata(right, metadata)
}

function buildGableHouse(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  definition: BuildingTypeDefinition,
  wallMat: StandardMaterial,
  roofMat: StandardMaterial,
  trimMat: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  addBox(
    root,
    scene,
    `${prefix}_walls`,
    {
      width: definition.width,
      height: definition.wallHeight,
      depth: definition.depth,
    },
    new Vector3(0, definition.wallHeight * 0.5, 0),
    wallMat,
    metadata,
  )
  addBox(
    root,
    scene,
    `${prefix}_door`,
    { width: definition.width * 0.18, height: definition.wallHeight * 0.42, depth: 0.2 },
    new Vector3(0, definition.wallHeight * 0.21, definition.depth * 0.5 + 0.05),
    trimMat,
    metadata,
  )
  addGableRoof(
    root,
    scene,
    prefix,
    definition.width * 1.02,
    definition.depth,
    definition.wallHeight,
    definition.roofHeight,
    roofMat,
    metadata,
  )
}

function buildDuplexHouse(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  definition: BuildingTypeDefinition,
  wallMat: StandardMaterial,
  roofMat: StandardMaterial,
  trimMat: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  const half = definition.width * 0.48
  addBox(
    root,
    scene,
    `${prefix}_left`,
    { width: half, height: definition.wallHeight, depth: definition.depth },
    new Vector3(-definition.width * 0.25, definition.wallHeight * 0.5, 0),
    wallMat,
    metadata,
  )
  addBox(
    root,
    scene,
    `${prefix}_right`,
    { width: half, height: definition.wallHeight, depth: definition.depth },
    new Vector3(definition.width * 0.25, definition.wallHeight * 0.5, 0),
    wallMat,
    metadata,
  )
  addBox(
    root,
    scene,
    `${prefix}_center`,
    { width: definition.width * 0.08, height: definition.wallHeight, depth: definition.depth },
    new Vector3(0, definition.wallHeight * 0.5, 0),
    trimMat,
    metadata,
  )
  addGableRoof(
    root,
    scene,
    prefix,
    definition.width,
    definition.depth,
    definition.wallHeight,
    definition.roofHeight,
    roofMat,
    metadata,
  )
}

function buildFarmHouse(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  definition: BuildingTypeDefinition,
  wallMat: StandardMaterial,
  roofMat: StandardMaterial,
  trimMat: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  const mainDepth = definition.depth * 0.62
  addBox(
    root,
    scene,
    `${prefix}_main`,
    { width: definition.width, height: definition.wallHeight, depth: mainDepth },
    new Vector3(0, definition.wallHeight * 0.5, -definition.depth * 0.16),
    wallMat,
    metadata,
  )
  addBox(
    root,
    scene,
    `${prefix}_wing`,
    {
      width: definition.width * 0.42,
      height: definition.wallHeight * 0.82,
      depth: definition.depth * 0.34,
    },
    new Vector3(definition.width * 0.22, definition.wallHeight * 0.41, definition.depth * 0.28),
    wallMat,
    metadata,
  )
  addBox(
    root,
    scene,
    `${prefix}_porch`,
    {
      width: definition.width * 0.55,
      height: definition.wallHeight * 0.12,
      depth: definition.depth * 0.18,
    },
    new Vector3(0, definition.wallHeight * 0.06, definition.depth * 0.42),
    trimMat,
    metadata,
  )
  addGableRoof(
    root,
    scene,
    prefix,
    definition.width * 1.04,
    mainDepth,
    definition.wallHeight,
    definition.roofHeight,
    roofMat,
    metadata,
  )
}

function buildChurch(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  definition: BuildingTypeDefinition,
  wallMat: StandardMaterial,
  roofMat: StandardMaterial,
  trimMat: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  const naveDepth = definition.depth * 0.68
  addBox(
    root,
    scene,
    `${prefix}_nave`,
    { width: definition.width, height: definition.wallHeight * 0.72, depth: naveDepth },
    new Vector3(0, definition.wallHeight * 0.36, -definition.depth * 0.1),
    wallMat,
    metadata,
  )
  const tower = MeshBuilder.CreateBox(
    `${prefix}_tower`,
    {
      width: definition.width * 0.28,
      height: definition.wallHeight,
      depth: definition.width * 0.28,
    },
    scene,
  )
  tower.parent = root
  tower.position = new Vector3(0, definition.wallHeight * 0.5, definition.depth * 0.32)
  tower.material = trimMat
  attachMetadata(tower, metadata)

  const spire = MeshBuilder.CreateCylinder(
    `${prefix}_spire`,
    {
      height: definition.roofHeight * 1.6,
      diameterTop: 0.2,
      diameterBottom: definition.width * 0.22,
      tessellation: 8,
    },
    scene,
  )
  spire.parent = root
  spire.position = new Vector3(0, definition.wallHeight + definition.roofHeight * 0.6, definition.depth * 0.32)
  spire.material = roofMat
  attachMetadata(spire, metadata)

  addGableRoof(
    root,
    scene,
    `${prefix}_nave_roof`,
    definition.width * 0.95,
    naveDepth,
    definition.wallHeight * 0.72,
    definition.roofHeight,
    roofMat,
    metadata,
  )
}

function buildCivicTower(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  definition: BuildingTypeDefinition,
  wallMat: StandardMaterial,
  roofMat: StandardMaterial,
  trimMat: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  buildGableHouse(root, scene, prefix, definition, wallMat, roofMat, trimMat, metadata)
  const tower = MeshBuilder.CreateBox(
    `${prefix}_tower`,
    {
      width: definition.width * 0.22,
      height: definition.wallHeight + definition.roofHeight * 0.8,
      depth: definition.width * 0.22,
    },
    scene,
  )
  tower.parent = root
  tower.position = new Vector3(
    definition.width * 0.32,
    (definition.wallHeight + definition.roofHeight * 0.8) * 0.5,
    definition.depth * 0.28,
  )
  tower.material = trimMat
  attachMetadata(tower, metadata)
}

function buildFlatBlock(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  definition: BuildingTypeDefinition,
  wallMat: StandardMaterial,
  roofMat: StandardMaterial,
  trimMat: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  addBox(
    root,
    scene,
    `${prefix}_main`,
    {
      width: definition.width,
      height: definition.wallHeight,
      depth: definition.depth,
    },
    new Vector3(0, definition.wallHeight * 0.5, 0),
    wallMat,
    metadata,
  )
  addBox(
    root,
    scene,
    `${prefix}_wing`,
    {
      width: definition.width * 0.35,
      height: definition.wallHeight * 0.75,
      depth: definition.depth * 0.45,
    },
    new Vector3(-definition.width * 0.3, definition.wallHeight * 0.375, definition.depth * 0.22),
    trimMat,
    metadata,
  )
  addBox(
    root,
    scene,
    `${prefix}_roof`,
    {
      width: definition.width * 1.02,
      height: definition.roofHeight,
      depth: definition.depth * 1.02,
    },
    new Vector3(0, definition.wallHeight + definition.roofHeight * 0.5, 0),
    roofMat,
    metadata,
  )
}

function buildShopFront(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  definition: BuildingTypeDefinition,
  wallMat: StandardMaterial,
  roofMat: StandardMaterial,
  trimMat: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  addBox(
    root,
    scene,
    `${prefix}_walls`,
    {
      width: definition.width,
      height: definition.wallHeight,
      depth: definition.depth,
    },
    new Vector3(0, definition.wallHeight * 0.5, 0),
    wallMat,
    metadata,
  )
  addBox(
    root,
    scene,
    `${prefix}_awning`,
    {
      width: definition.width * 0.9,
      height: 0.12,
      depth: definition.depth * 0.35,
    },
    new Vector3(0, definition.wallHeight * 0.72, definition.depth * 0.42),
    trimMat,
    metadata,
  )
  addBox(
    root,
    scene,
    `${prefix}_window`,
    {
      width: definition.width * 0.65,
      height: definition.wallHeight * 0.35,
      depth: 0.15,
    },
    new Vector3(0, definition.wallHeight * 0.42, definition.depth * 0.5 + 0.05),
    trimMat,
    metadata,
  )
  addGableRoof(
    root,
    scene,
    prefix,
    definition.width,
    definition.depth,
    definition.wallHeight,
    definition.roofHeight,
    roofMat,
    metadata,
  )
}

function buildBarn(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  definition: BuildingTypeDefinition,
  wallMat: StandardMaterial,
  roofMat: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  addBox(
    root,
    scene,
    `${prefix}_walls`,
    {
      width: definition.width,
      height: definition.wallHeight,
      depth: definition.depth,
    },
    new Vector3(0, definition.wallHeight * 0.5, 0),
    wallMat,
    metadata,
  )
  const roof = MeshBuilder.CreateBox(
    `${prefix}_roof`,
    {
      width: definition.width * 1.05,
      height: definition.roofHeight,
      depth: definition.depth * 0.55,
    },
    scene,
  )
  roof.parent = root
  roof.position = new Vector3(0, definition.wallHeight + definition.roofHeight * 0.45, 0)
  roof.rotation.x = 0.08
  roof.material = roofMat
  attachMetadata(roof, metadata)
}

function buildSilo(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  definition: BuildingTypeDefinition,
  wallMat: StandardMaterial,
  roofMat: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  const body = MeshBuilder.CreateCylinder(
    `${prefix}_body`,
    {
      height: definition.wallHeight,
      diameter: definition.width,
      tessellation: 16,
    },
    scene,
  )
  body.parent = root
  body.position.y = definition.wallHeight * 0.5
  body.material = wallMat
  attachMetadata(body, metadata)

  const cap = MeshBuilder.CreateCylinder(
    `${prefix}_cap`,
    {
      height: definition.roofHeight,
      diameterTop: 0.3,
      diameterBottom: definition.width * 1.05,
      tessellation: 16,
    },
    scene,
  )
  cap.parent = root
  cap.position.y = definition.wallHeight + definition.roofHeight * 0.5
  cap.material = roofMat
  attachMetadata(cap, metadata)
}

function buildShed(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  definition: BuildingTypeDefinition,
  wallMat: StandardMaterial,
  roofMat: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  addBox(
    root,
    scene,
    `${prefix}_walls`,
    {
      width: definition.width,
      height: definition.wallHeight,
      depth: definition.depth,
    },
    new Vector3(0, definition.wallHeight * 0.5, 0),
    wallMat,
    metadata,
  )
  addGableRoof(
    root,
    scene,
    prefix,
    definition.width,
    definition.depth,
    definition.wallHeight,
    definition.roofHeight,
    roofMat,
    metadata,
  )
}

function buildMill(
  root: TransformNode,
  scene: Scene,
  prefix: string,
  definition: BuildingTypeDefinition,
  wallMat: StandardMaterial,
  roofMat: StandardMaterial,
  trimMat: StandardMaterial,
  metadata: StudioMeshMetadata,
): void {
  buildGableHouse(root, scene, prefix, definition, wallMat, roofMat, trimMat, metadata)
  const wheel = MeshBuilder.CreateCylinder(
    `${prefix}_wheel`,
    { height: 0.35, diameter: definition.width * 0.45, tessellation: 12 },
    scene,
  )
  wheel.parent = root
  wheel.rotation.z = Math.PI * 0.5
  wheel.position = new Vector3(
    definition.width * 0.55,
    definition.wallHeight * 0.35,
    definition.depth * 0.42,
  )
  wheel.material = trimMat
  attachMetadata(wheel, metadata)
}

export function createBuildingPlaceholder(
  scene: Scene,
  nodeName: string,
  definition: BuildingTypeDefinition,
  metadata: StudioMeshMetadata,
  options?: { preview?: boolean },
): TransformNode {
  const root = new TransformNode(nodeName, scene)
  const preview = options?.preview ?? false
  const wallMat = makeMaterial(scene, `${nodeName}_wall`, rgb(definition.wallColor), preview)
  const roofMat = makeMaterial(scene, `${nodeName}_roof`, rgb(definition.roofColor), preview)
  const trimMat = makeMaterial(scene, `${nodeName}_trim`, rgb(definition.trimColor), preview)

  switch (definition.meshStyle) {
    case 'gable_house':
      buildGableHouse(root, scene, nodeName, definition, wallMat, roofMat, trimMat, metadata)
      break
    case 'farm_house':
      buildFarmHouse(root, scene, nodeName, definition, wallMat, roofMat, trimMat, metadata)
      break
    case 'duplex_house':
      buildDuplexHouse(root, scene, nodeName, definition, wallMat, roofMat, trimMat, metadata)
      break
    case 'church':
      buildChurch(root, scene, nodeName, definition, wallMat, roofMat, trimMat, metadata)
      break
    case 'civic_tower':
      buildCivicTower(root, scene, nodeName, definition, wallMat, roofMat, trimMat, metadata)
      break
    case 'flat_block':
      buildFlatBlock(root, scene, nodeName, definition, wallMat, roofMat, trimMat, metadata)
      break
    case 'shop_front':
      buildShopFront(root, scene, nodeName, definition, wallMat, roofMat, trimMat, metadata)
      break
    case 'barn':
      buildBarn(root, scene, nodeName, definition, wallMat, roofMat, metadata)
      break
    case 'silo':
      buildSilo(root, scene, nodeName, definition, wallMat, roofMat, metadata)
      break
    case 'shed':
      buildShed(root, scene, nodeName, definition, wallMat, roofMat, metadata)
      break
    case 'mill':
      buildMill(root, scene, nodeName, definition, wallMat, roofMat, trimMat, metadata)
      break
    default:
      buildGableHouse(root, scene, nodeName, definition, wallMat, roofMat, trimMat, metadata)
  }

  return root
}

export function positionBuildingRoot(
  root: TransformNode,
  position: { x: number; y: number; z: number },
  rotationY: number,
): void {
  root.position = new Vector3(position.x, position.y, position.z)
  root.rotation.y = rotationY
}

export function disposeBuildingNode(scene: Scene, objectId: string): void {
  const node = scene.getTransformNodeByName(`studio_${objectId}`)
  node?.dispose(false, true)
}

const BUILDING_PREVIEW_ID = '__building_preview__'

export function disposeBuildingPreviewNode(scene: Scene): void {
  disposeBuildingNode(scene, BUILDING_PREVIEW_ID)
}

export { BUILDING_PREVIEW_ID }
