import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'
import { createTerrainGroundMesh } from '@/rendering/terrain/TerrainRenderPipeline.ts'
import { VegetationSystem } from '@/rendering/vegetation/VegetationSystem.ts'
import { FarmDecorationsBuilder } from './FarmDecorationsBuilder.ts'
import { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import { loadRuntimeMachines } from '@/maps/MapRuntimeLoader.ts'
import { tryGetActiveMapContext } from '@/maps/MapRuntimeContext.ts'
import { getGroundedPosition } from '@/maps/grounding.ts'
import {
  createCombineGameplayMesh,
  createTractorGameplayMesh,
} from './RuntimeMachineMeshBuilder.ts'
import {
  getActiveFarmHub,
  getActiveFieldLayout,
  getActiveWorldCenter,
  getActiveWorldTerrainSize,
} from '@/config/farm-layout.ts'
import { getInteractionPointCatalog } from '@/config/interaction-point-catalog.ts'
import { MachineId } from '@/types/machine.ts'

const VALLEY_COLOR = new Color3(0.22, 0.4, 0.15)
const FIELD_BASE_COLOR = new Color3(0.42, 0.28, 0.16)
const FARMYARD_COLOR = new Color3(0.58, 0.48, 0.34)
export class FarmSceneBuilder {
  private readonly decorations = new FarmDecorationsBuilder()
  private readonly mapSceneBuilder = new MapSceneBuilder()
  private readonly vegetationSystem = new VegetationSystem()

  getVegetationSystem(): VegetationSystem {
    return this.vegetationSystem
  }

  build(scene: Scene): void {
    const worldMap = tryGetActiveMapContext()?.worldMap
    if (worldMap) {
      this.mapSceneBuilder.build(scene, worldMap, {
        omitLayers: ['vehicles', 'vegetation'],
        renderGameplayAnchors: false,
        renderTerrainBoundary: false,
      })
      loadRuntimeMachines(scene, worldMap)
      this.createInteractionPoints(scene)
      this.vegetationSystem.build(scene, { worldMap })
      return
    }

    this.createTerrain(scene)
    this.createValleyBackdrop(scene)
    this.decorations.build(scene, { skipVegetation: true })
    this.createFields(scene)
    this.createFarmyard(scene)
    this.createBarn(scene)
    this.createMill(scene)
    this.createDealership(scene)
    this.createTractor(scene)
    this.createCombines(scene)
    this.createInteractionPoints(scene)
    this.vegetationSystem.build(scene)
  }

  private createTerrain(scene: Scene): void {
    const { width, depth } = getActiveWorldTerrainSize()
    const center = getActiveWorldCenter()

    const terrain = createTerrainGroundMesh(scene, 'terrain', {
      width,
      depth,
      resolution: 32,
      updatable: false,
      defaultLegacySurfaceId: 0,
    })
    terrain.position = new Vector3(center.x, 0, center.z)
  }

  private createValleyBackdrop(scene: Scene): void {
    const center = getActiveWorldCenter()
    const valley = MeshBuilder.CreateGround(
      'valley_backdrop',
      { width: 90, height: 50 },
      scene,
    )
    valley.position = new Vector3(center.x - 20, 0.005, center.z - 35)
    valley.isPickable = false

    const material = new StandardMaterial('valleyBackdropMaterial', scene)
    material.diffuseColor = VALLEY_COLOR
    material.specularColor = new Color3(0.03, 0.05, 0.02)
    valley.material = material
  }

  private createFields(scene: Scene): void {
    for (const field of getActiveFieldLayout()) {
      const fieldMesh = MeshBuilder.CreateBox(
        field.id,
        {
          width: field.meshSize.width,
          height: 0.08,
          depth: field.meshSize.depth,
        },
        scene,
      )
      fieldMesh.position = new Vector3(
        field.position.x,
        0.04,
        field.position.z,
      )
      if (field.rotationY) {
        fieldMesh.rotation.y = field.rotationY
      }

      const material = new StandardMaterial(
        `fieldMaterial_${field.id}`,
        scene,
      )
      material.diffuseColor = FIELD_BASE_COLOR.clone()
      material.specularColor = new Color3(0.05, 0.04, 0.02)
      fieldMesh.material = material
      fieldMesh.receiveShadows = true
    }
  }

  private createFarmyard(scene: Scene): void {
    const { position, size } = getActiveFarmHub().farmyard
    const farmyard = MeshBuilder.CreateBox(
      'farmyard',
      { width: size.width, height: 0.06, depth: size.depth },
      scene,
    )
    farmyard.position = new Vector3(position.x, 0.03, position.z)
    farmyard.isPickable = false

    const farmyardMaterial = new StandardMaterial('farmyardMaterial', scene)
    farmyardMaterial.diffuseColor = FARMYARD_COLOR
    farmyardMaterial.specularColor = new Color3(0.06, 0.05, 0.03)
    farmyard.material = farmyardMaterial
    farmyard.receiveShadows = true
  }

  private createBarn(scene: Scene): void {
    const barn = getActiveFarmHub().barn
    const root = new TransformNode('barn_root', scene)
    root.position = new Vector3(
      barn.position.x,
      0,
      barn.position.z,
    )

    const wallMat = new StandardMaterial('barnWallMaterial', scene)
    wallMat.diffuseColor = new Color3(0.72, 0.24, 0.18)
    wallMat.specularColor = new Color3(0.08, 0.04, 0.03)

    const trimMat = new StandardMaterial('barnTrimMaterial', scene)
    trimMat.diffuseColor = new Color3(0.48, 0.32, 0.2)

    const roofMat = new StandardMaterial('barnRoofMaterial', scene)
    roofMat.diffuseColor = new Color3(0.32, 0.2, 0.12)
    roofMat.specularColor = new Color3(0.05, 0.04, 0.03)

    const body = MeshBuilder.CreateBox(
      'barn',
      { width: 6.2, height: 3.8, depth: 5.2 },
      scene,
    )
    body.position = new Vector3(0, 1.9, 0)
    body.material = wallMat
    body.parent = root
    body.receiveShadows = true

    const door = MeshBuilder.CreateBox(
      'barnDoor',
      { width: 1.6, height: 2.4, depth: 0.12 },
      scene,
    )
    door.position = new Vector3(0, 1.2, 2.62)
    door.material = trimMat
    door.parent = root

    const loft = MeshBuilder.CreateBox(
      'barnLoft',
      { width: 1.4, height: 0.9, depth: 0.12 },
      scene,
    )
    loft.position = new Vector3(0, 2.8, 2.62)
    loft.material = trimMat
    loft.parent = root

    const roofLeft = MeshBuilder.CreateBox(
      'barnRoofLeft',
      { width: 3.4, height: 0.25, depth: 5.8 },
      scene,
    )
    roofLeft.position = new Vector3(-1.55, 4.15, 0)
    roofLeft.rotation.z = 0.42
    roofLeft.material = roofMat
    roofLeft.parent = root
    roofLeft.receiveShadows = true

    const roofRight = MeshBuilder.CreateBox(
      'barnRoofRight',
      { width: 3.4, height: 0.25, depth: 5.8 },
      scene,
    )
    roofRight.position = new Vector3(1.55, 4.15, 0)
    roofRight.rotation.z = -0.42
    roofRight.material = roofMat
    roofRight.parent = root
    roofRight.receiveShadows = true

    const silo = MeshBuilder.CreateCylinder(
      'barnSilo',
      { height: 5.5, diameter: 2.2 },
      scene,
    )
    silo.position = new Vector3(4.2, 2.75, -0.8)
    silo.material = trimMat
    silo.parent = root
    silo.receiveShadows = true

    const siloCap = MeshBuilder.CreateSphere(
      'barnSiloCap',
      { diameter: 2.3, segments: 10 },
      scene,
    )
    siloCap.position = new Vector3(4.2, 5.6, -0.8)
    siloCap.scaling.y = 0.45
    siloCap.material = roofMat
    siloCap.parent = root
  }

  private createMill(scene: Scene): void {
    const mill = getActiveFarmHub().mill.position
    const body = MeshBuilder.CreateBox(
      'mill_building',
      { width: 3.2, height: 2.8, depth: 3.6 },
      scene,
    )
    body.position = new Vector3(mill.x, 1.4, mill.z)

    const material = new StandardMaterial('millBuildingMaterial', scene)
    material.diffuseColor = new Color3(0.62, 0.55, 0.42)
    material.specularColor = new Color3(0.06, 0.05, 0.04)
    material.emissiveColor = new Color3(0.02, 0.02, 0.015)
    body.material = material
    body.receiveShadows = true

    const roof = MeshBuilder.CreateBox(
      'mill_roof',
      { width: 3.6, height: 0.35, depth: 4 },
      scene,
    )
    roof.position = new Vector3(mill.x, 2.95, mill.z)
    const roofMat = new StandardMaterial('millRoofMaterial', scene)
    roofMat.diffuseColor = new Color3(0.38, 0.28, 0.2)
    roof.material = roofMat
    roof.receiveShadows = true
  }

  private createDealership(scene: Scene): void {
    const dealership = getActiveFarmHub().dealership
    const root = new TransformNode('dealership_root', scene)
    root.position = new Vector3(
      dealership.position.x,
      0,
      dealership.position.z,
    )

    const wallMaterial = new StandardMaterial('dealership_wall_mat', scene)
    wallMaterial.diffuseColor = new Color3(0.72, 0.68, 0.62)

    const roofMaterial = new StandardMaterial('dealership_roof_mat', scene)
    roofMaterial.diffuseColor = new Color3(0.35, 0.42, 0.55)

    const signMaterial = new StandardMaterial('dealership_sign_mat', scene)
    signMaterial.diffuseColor = new Color3(0.85, 0.7, 0.2)
    signMaterial.emissiveColor = new Color3(0.25, 0.18, 0.04)

    const showroom = MeshBuilder.CreateBox(
      'dealership_showroom',
      { width: 8, height: 3.2, depth: 6 },
      scene,
    )
    showroom.position = new Vector3(0, 1.6, 0)
    showroom.parent = root
    showroom.material = wallMaterial
    showroom.receiveShadows = true
    showroom.isPickable = false

    const roof = MeshBuilder.CreateBox(
      'dealership_roof',
      { width: 8.6, height: 0.35, depth: 6.6 },
      scene,
    )
    roof.position = new Vector3(0, 3.35, 0)
    roof.parent = root
    roof.material = roofMaterial
    roof.isPickable = false

    const sign = MeshBuilder.CreateBox(
      'dealership_sign',
      { width: 3.6, height: 0.8, depth: 0.15 },
      scene,
    )
    sign.position = new Vector3(0, 3.9, 3.1)
    sign.parent = root
    sign.material = signMaterial
    sign.isPickable = false
  }

  private createTractor(scene: Scene): void {
    const hub = getActiveFarmHub()
    const spawn = getGroundedPosition(
      hub.tractorHome.position.x,
      hub.tractorHome.position.z,
    )
    createTractorGameplayMesh(
      scene,
      spawn,
      hub.tractorHome.rotationY ?? -Math.PI / 6,
    )
  }

  private createCombines(scene: Scene): void {
    const hub = getActiveFarmHub()
    const grainSpawn = getGroundedPosition(
      hub.grainCombineHome.position.x,
      hub.grainCombineHome.position.z,
    )
    createCombineGameplayMesh(
      scene,
      MachineId.GrainCombine1,
      grainSpawn,
      hub.grainCombineHome.rotationY ?? -Math.PI / 6,
    )
    const cornSpawn = getGroundedPosition(
      hub.cornCombineHome.position.x,
      hub.cornCombineHome.position.z,
    )
    createCombineGameplayMesh(
      scene,
      MachineId.CornCombine1,
      cornSpawn,
      hub.cornCombineHome.rotationY ?? -Math.PI / 6,
    )
  }

  private createInteractionPoints(scene: Scene): void {
    const padMaterial = new StandardMaterial('interactionPadMaterial', scene)
    padMaterial.diffuseColor = new Color3(0.75, 0.62, 0.2)
    padMaterial.emissiveColor = new Color3(0.2, 0.15, 0.02)

    const markerMaterial = new StandardMaterial('interactionMarkerMaterial', scene)
    markerMaterial.diffuseColor = new Color3(0.9, 0.75, 0.2)
    markerMaterial.emissiveColor = new Color3(0.35, 0.25, 0.05)

    for (const point of getInteractionPointCatalog()) {
      const root = new TransformNode(`interaction_root_${point.id}`, scene)
      root.position = new Vector3(
        point.position.x,
        point.position.y,
        point.position.z,
      )

      const pad = MeshBuilder.CreateCylinder(
        point.meshName,
        { height: 0.08, diameter: 3.2 },
        scene,
      )
      pad.position.y = 0.04
      pad.material = padMaterial
      pad.parent = root
      pad.isPickable = true
      pad.receiveShadows = true

      const marker = MeshBuilder.CreateBox(
        `${point.meshName}_marker`,
        { width: 0.4, height: 1.6, depth: 0.4 },
        scene,
      )
      marker.position.y = 0.9
      marker.material = markerMaterial
      marker.parent = root
      marker.isPickable = true
    }
  }
}
