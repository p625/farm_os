import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
  type Scene,
} from '@babylonjs/core'
import { getMachineCatalogEntry } from '@/config/machine-catalog.ts'
import { MachineId } from '@/types/machine.ts'
import type { RuntimeMachineSpawn } from '@/maps/resolveRuntimeMachineSpawns.ts'
import { createTractorVisual } from './TractorMeshBuilder.ts'

const TRACTOR_BODY_COLOR = new Color3(0.15, 0.42, 0.15)
const TRACTOR_CABIN_COLOR = new Color3(0.2, 0.5, 0.2)
const TRACTOR_WHEEL_COLOR = new Color3(0.12, 0.12, 0.12)

const COMBINE_APPEARANCE: Record<
  string,
  { body: Color3; accent: Color3 }
> = {
  [MachineId.GrainCombine1]: {
    body: new Color3(0.75, 0.55, 0.12),
    accent: new Color3(0.85, 0.2, 0.12),
  },
  [MachineId.CornCombine1]: {
    body: new Color3(0.7, 0.5, 0.1),
    accent: new Color3(0.2, 0.55, 0.2),
  },
}

export function createTractorGameplayMesh(
  scene: Scene,
  position: { x: number; y: number; z: number },
  rotationY: number,
): TransformNode {
  const root = new TransformNode('tractor', scene)
  root.position = new Vector3(position.x, position.y, position.z)
  root.rotation.y = rotationY

  const bodyMaterial = new StandardMaterial('tractorBodyMaterial', scene)
  bodyMaterial.diffuseColor = TRACTOR_BODY_COLOR
  bodyMaterial.specularColor = new Color3(0.08, 0.1, 0.06)

  const cabinMaterial = new StandardMaterial('tractorCabinMaterial', scene)
  cabinMaterial.diffuseColor = TRACTOR_CABIN_COLOR

  const wheelMaterial = new StandardMaterial('tractorWheelMaterial', scene)
  wheelMaterial.diffuseColor = TRACTOR_WHEEL_COLOR
  wheelMaterial.specularColor = new Color3(0.02, 0.02, 0.02)

  const body = MeshBuilder.CreateBox(
    'tractorBody',
    { width: 2.2, height: 1.2, depth: 3.6 },
    scene,
  )
  body.position = new Vector3(0, 0.9, 0)
  body.parent = root
  body.material = bodyMaterial
  body.receiveShadows = true

  const cabin = MeshBuilder.CreateBox(
    'tractorCabin',
    { width: 1.4, height: 1.1, depth: 1.4 },
    scene,
  )
  cabin.position = new Vector3(0, 1.85, -0.6)
  cabin.parent = root
  cabin.material = cabinMaterial
  cabin.receiveShadows = true

  const hood = MeshBuilder.CreateBox(
    'tractorHood',
    { width: 1.6, height: 0.8, depth: 1.2 },
    scene,
  )
  hood.position = new Vector3(0, 1.1, 1.3)
  hood.parent = root
  hood.material = bodyMaterial

  const wheelPositions: [number, number][] = [
    [-1.1, 1.2],
    [1.1, 1.2],
    [-1.1, -1.2],
    [1.1, -1.2],
  ]

  for (const [index, [x, z]] of wheelPositions.entries()) {
    const wheel = MeshBuilder.CreateCylinder(
      `tractorWheel_${index + 1}`,
      { height: 0.5, diameter: 1.1 },
      scene,
    )
    wheel.rotation.z = Math.PI / 2
    wheel.position = new Vector3(x, 0.55, z)
    wheel.parent = root
    wheel.material = wheelMaterial
    wheel.receiveShadows = true
  }

  const exhaust = MeshBuilder.CreateCylinder(
    'tractorExhaust',
    { height: 0.8, diameter: 0.2 },
    scene,
  )
  exhaust.position = new Vector3(0.5, 2.2, 0.2)
  exhaust.parent = root
  exhaust.material = wheelMaterial

  return root
}

export function createCombineGameplayMesh(
  scene: Scene,
  machineId: MachineId,
  position: { x: number; y: number; z: number },
  rotationY: number,
): TransformNode | null {
  const catalog = getMachineCatalogEntry(machineId)
  if (!catalog) {
    return null
  }

  const appearance = COMBINE_APPEARANCE[machineId]
  if (!appearance) {
    return null
  }

  const nodeName = catalog.sceneNodeName
  const root = new TransformNode(nodeName, scene)
  root.position = new Vector3(position.x, position.y, position.z)
  root.rotation.y = rotationY

  const bodyMaterial = new StandardMaterial(`${nodeName}_body_mat`, scene)
  bodyMaterial.diffuseColor = appearance.body

  const accentMaterial = new StandardMaterial(`${nodeName}_accent_mat`, scene)
  accentMaterial.diffuseColor = appearance.accent

  const wheelMaterial = new StandardMaterial(`${nodeName}_wheel_mat`, scene)
  wheelMaterial.diffuseColor = TRACTOR_WHEEL_COLOR

  const body = MeshBuilder.CreateBox(
    `${nodeName}_body`,
    { width: 3.2, height: 2.4, depth: 5.5 },
    scene,
  )
  body.position = new Vector3(0, 1.4, 0)
  body.parent = root
  body.material = bodyMaterial
  body.isPickable = true
  body.receiveShadows = true

  const cab = MeshBuilder.CreateBox(
    `${nodeName}_cab`,
    { width: 1.8, height: 1.6, depth: 1.8 },
    scene,
  )
  cab.position = new Vector3(0, 2.8, -1.2)
  cab.parent = root
  cab.material = accentMaterial
  cab.isPickable = true

  const hopper = MeshBuilder.CreateBox(
    `${nodeName}_hopper`,
    { width: 2.4, height: 1.2, depth: 2.2 },
    scene,
  )
  hopper.position = new Vector3(0, 3.2, 0.8)
  hopper.parent = root
  hopper.material = bodyMaterial
  hopper.isPickable = true

  for (const [index, [x, z]] of [
    [-1.3, 1.8],
    [1.3, 1.8],
    [-1.3, -1.8],
    [1.3, -1.8],
  ].entries()) {
    const wheel = MeshBuilder.CreateCylinder(
      `${nodeName}_wheel_${index}`,
      { height: 0.55, diameter: 1.2 },
      scene,
    )
    wheel.rotation.z = Math.PI / 2
    wheel.position = new Vector3(x, 0.6, z)
    wheel.parent = root
    wheel.material = wheelMaterial
  }

  return root
}

export function spawnRuntimeMachineMesh(
  scene: Scene,
  spawn: RuntimeMachineSpawn,
): void {
  const catalog = getMachineCatalogEntry(spawn.machineId)
  if (!catalog) {
    return
  }

  if (scene.getTransformNodeByName(catalog.sceneNodeName)) {
    return
  }

  if (spawn.machineId === MachineId.Tractor1) {
    createTractorGameplayMesh(scene, spawn.position, spawn.rotationY)
    return
  }

  if (spawn.machineId.startsWith('tractor_')) {
    createTractorVisual(
      scene,
      spawn.machineId,
      catalog.sceneNodeName,
      catalog.bodyMeshName,
      spawn.position,
      spawn.rotationY,
    )
    return
  }

  createCombineGameplayMesh(
    scene,
    spawn.machineId,
    spawn.position,
    spawn.rotationY,
  )
}
