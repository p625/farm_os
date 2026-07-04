import type { AbstractMesh, Mesh, Scene } from '@babylonjs/core'
import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'
import { FarmEnvironment } from '@rendering/FarmEnvironment.ts'
import {
  createTerrainGroundMesh,
  prepareTerrainMeshForLiveEdit,
  syncTerrainMesh,
  syncTerrainMeshField,
  type SyncTerrainMeshOptions,
} from '@/studio/terrain/TerrainMeshSync.ts'
import { ensureTerrainHeightfield, applyTerrainHeightToPoint, sampleTerrainHeightBilinear } from '@/studio/terrain/TerrainHeightmap.ts'
import type { TerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { createRoadRibbonMesh, ROAD_SURFACE_OFFSET, snapRoadPointsToTerrain } from '@/studio/road/RoadMeshBuilder.ts'
import { parseRoadProperties } from '@/types/road.ts'
import type { RoadControlPoint, RoadKind } from '@/types/road.ts'
import type { MapObject, StudioLayerId, WorldMapDocument } from '@/types/world-map.ts'
import type { ParcelRect } from '@/studio/parcel/ParcelMath.ts'
import { FIELD_SURFACE_THICKNESS } from '@/studio/parcel/parcelObject.ts'
import { sampleFieldSurfaceY as computeFieldSurfaceY } from '@/studio/parcel/parcelSurface.ts'
import { sampleVegetationGroundY as computeVegetationGroundY } from '@/studio/vegetation/vegetationSurface.ts'
import {
  createVegetationPlaceholder,
  disposeVegetationNode,
  positionVegetationRoot,
} from '@/studio/vegetation/VegetationMeshBuilder.ts'
import { getVegetationTypeDefinition } from '@/studio/vegetation/VegetationTypePalette.ts'
import type { VegetationTypeDefinition } from '@/studio/vegetation/VegetationTypePalette.ts'
import { parseVegetationProperties } from '@/types/vegetation.ts'
import { parseBuildingProperties } from '@/types/building.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'
import { createAnchorGizmoMesh } from '@/studio/anchor/AnchorGizmoBuilder.ts'
import { getVehicleTypeDefinition } from '@/studio/vehicle/VehicleTypePalette.ts'
import { parseWaterProperties } from '@/types/water.ts'
import type { WaterControlPoint, WaterTypeId } from '@/types/water.ts'
import {
  createWaterAreaMesh,
  createWaterRibbonMesh,
} from '@/studio/water/WaterMeshBuilder.ts'
import { getWaterTypeDefinition } from '@/studio/water/WaterTypePalette.ts'
import { sampleWaterSurfaceY as computeWaterSurfaceY } from '@/studio/water/waterSurface.ts'
import type { WaterEllipse } from '@/studio/water/WaterAreaMath.ts'
import {
  BUILDING_PREVIEW_ID,
  createBuildingPlaceholder,
  disposeBuildingNode,
  disposeBuildingPreviewNode,
  positionBuildingRoot,
} from '@/studio/building/BuildingMeshBuilder.ts'
import { getBuildingTypeDefinition } from '@/studio/building/BuildingTypePalette.ts'
import type { BuildingTypeDefinition } from '@/studio/building/BuildingTypePalette.ts'
import { sampleBuildingGroundY as computeBuildingGroundY } from '@/studio/building/buildingSurface.ts'
import type { MapValidationReport } from '@/types/map-validation.ts'

const PARCEL_DRAFT_ID = '__parcel_draft__'
const VEGETATION_PREVIEW_ID = '__vegetation_preview__'
const WATER_SPLINE_DRAFT_ID = '__water_spline_draft__'
const WATER_AREA_DRAFT_ID = '__water_area_draft__'
const VALIDATION_OVERLAY_ID = '__validation_overlay__'

export const STUDIO_ROAD_POINT_KEY = 'farmosStudioRoadPoint'

export interface StudioRoadPointMetadata {
  roadId: string
  pointIndex: number
  isDraft?: boolean
}

export const STUDIO_METADATA_KEY = 'farmosStudio'

export interface StudioMeshMetadata {
  objectId: string
  layer: StudioLayerId
  kind: string
  mapObject: MapObject
}

const LAYER_COLORS: Record<StudioLayerId, Color3> = {
  terrain: new Color3(0.26, 0.46, 0.18),
  roads: new Color3(0.45, 0.4, 0.32),
  fields: new Color3(0.42, 0.28, 0.16),
  vegetation: new Color3(0.2, 0.5, 0.22),
  buildings: new Color3(0.58, 0.48, 0.34),
  water: new Color3(0.2, 0.35, 0.55),
  vehicles: new Color3(0.22, 0.55, 0.72),
  poi: new Color3(0.85, 0.75, 0.2),
  debug: new Color3(0.9, 0.2, 0.9),
}

export class MapSceneBuilder {
  private readonly environment = new FarmEnvironment()
  private rootNode: TransformNode | null = null
  private lastMap: WorldMapDocument | null = null

  build(scene: Scene, map: WorldMapDocument): TransformNode {
    this.dispose(scene)
    this.lastMap = map
    this.environment.apply(scene)

    const root = new TransformNode('studio_map_root', scene)
    this.rootNode = root

    for (const object of map.objects) {
      this.createObjectMesh(scene, root, object, map)
    }

    return root
  }

  dispose(scene: Scene): void {
    this.disposeValidationMarkers(scene)
    if (this.rootNode) {
      this.rootNode.dispose(false, true)
      this.rootNode = null
    }
    const orphan = scene.getTransformNodeByName('studio_map_root')
    orphan?.dispose(false, true)
  }

  private createObjectMesh(
    scene: Scene,
    root: TransformNode,
    object: MapObject,
    map: WorldMapDocument,
  ): void {
    if (object.layer === 'roads' && object.kind === 'road') {
      this.createRoadObjectMesh(scene, root, object, map)
      return
    }

    if (object.layer === 'vegetation') {
      this.createVegetationObjectMesh(scene, root, object)
      return
    }

    if (object.layer === 'buildings' && parseBuildingProperties(object.properties)) {
      this.createBuildingObjectMesh(scene, root, object)
      return
    }

    if (object.layer === 'vehicles' && parseVehiclePlacementProperties(object.properties)) {
      this.createVehicleObjectMesh(scene, root, object)
      return
    }

    if (object.layer === 'poi' && object.kind === 'anchor') {
      createAnchorGizmoMesh(scene, object, root)
      return
    }

    if (object.layer === 'water' && parseWaterProperties(object.properties)) {
      this.createWaterObjectMesh(scene, root, object, map)
      return
    }

    const shape = object.shape ?? {
      type: 'box' as const,
      width: 1,
      height: 1,
      depth: 1,
    }

    if (shape.type !== 'box') {
      return
    }

    const mesh =
      object.layer === 'terrain' && object.kind === 'ground'
        ? createTerrainGroundMesh(
            scene,
            `studio_${object.id}`,
            shape.width,
            shape.depth,
            ensureTerrainHeightfield(map.terrain).resolution,
          )
        : object.layer === 'terrain'
          ? MeshBuilder.CreateGround(
              `studio_${object.id}`,
              { width: shape.width, height: shape.depth },
              scene,
            )
          : MeshBuilder.CreateBox(
              `studio_${object.id}`,
              {
                width: shape.width,
                height: shape.height,
                depth: shape.depth,
              },
              scene,
            )

    mesh.parent = root
    mesh.position = new Vector3(
      object.transform.position.x,
      object.transform.position.y,
      object.transform.position.z,
    )
    if (object.transform.rotationY !== undefined) {
      mesh.rotation.y = object.transform.rotationY
    }
    if (object.transform.scale) {
      mesh.scaling = new Vector3(
        object.transform.scale.x,
        object.transform.scale.y,
        object.transform.scale.z,
      )
    }

    const material = new StandardMaterial(`mat_${object.id}`, scene)
    const base = LAYER_COLORS[object.layer].clone()
    material.diffuseColor = base
    material.specularColor = base.scale(0.15)
    if (object.layer === 'poi' || object.layer === 'debug') {
      material.emissiveColor = base.scale(0.25)
    }
    if (object.layer === 'terrain' && object.kind === 'ground') {
      material.emissiveColor = new Color3(0.02, 0.03, 0.01)
    }
    mesh.material = material
    mesh.receiveShadows = object.layer === 'terrain' || object.layer === 'fields'

    if (object.layer === 'terrain' && object.kind === 'ground') {
      prepareTerrainMeshForLiveEdit(mesh as Mesh)
      syncTerrainMesh(mesh as Mesh, map.terrain, object.transform.position.y)
    }

    const metadata: StudioMeshMetadata = {
      objectId: object.id,
      layer: object.layer,
      kind: object.kind,
      mapObject: object,
    }
    mesh.metadata = { [STUDIO_METADATA_KEY]: metadata }
  }

  private createWaterObjectMesh(
    scene: Scene,
    root: TransformNode,
    object: MapObject,
    map: WorldMapDocument,
  ): void {
    const props = parseWaterProperties(object.properties)
    if (!props) {
      return
    }

    const definition = getWaterTypeDefinition(props.waterType)
    const metadata: StudioMeshMetadata = {
      objectId: object.id,
      layer: 'water',
      kind: object.kind,
      mapObject: object,
    }
    const sampler = this.createTerrainHeightSampler(map)

    if (props.placementKind === 'spline') {
      const mesh = createWaterRibbonMesh(
        scene,
        `studio_${object.id}`,
        props.points,
        definition,
        sampler,
      )
      if (!mesh) {
        return
      }
      mesh.parent = root
      mesh.metadata = { [STUDIO_METADATA_KEY]: metadata }
      return
    }

    const surfaceY = computeWaterSurfaceY(
      map,
      object.transform.position.x,
      object.transform.position.z,
    )
    const mesh = createWaterAreaMesh(
      scene,
      `studio_${object.id}`,
      {
        centerX: object.transform.position.x,
        centerZ: object.transform.position.z,
        radiusX: props.radiusX,
        radiusZ: props.radiusZ,
      },
      surfaceY,
      definition,
    )
    mesh.parent = root
    mesh.metadata = { [STUDIO_METADATA_KEY]: metadata }
  }

  private createVehicleObjectMesh(
    scene: Scene,
    root: TransformNode,
    object: MapObject,
  ): void {
    const props = parseVehiclePlacementProperties(object.properties)
    if (!props) {
      return
    }
    const definition = getVehicleTypeDefinition(props.vehicleType)
    const mesh = MeshBuilder.CreateBox(
      `studio_${object.id}`,
      {
        width: definition.width,
        height: definition.height,
        depth: definition.depth,
      },
      scene,
    )
    mesh.parent = root
    mesh.position.x = object.transform.position.x
    mesh.position.y = object.transform.position.y + definition.height * 0.5
    mesh.position.z = object.transform.position.z
    if (object.transform.rotationY !== undefined) {
      mesh.rotation.y = object.transform.rotationY
    }
    const material = new StandardMaterial(`mat_${object.id}`, scene)
    const [r, g, b] = definition.color
    material.diffuseColor = new Color3(r, g, b)
    material.emissiveColor = new Color3(r * 0.15, g * 0.15, b * 0.15)
    mesh.material = material
    const metadata: StudioMeshMetadata = {
      objectId: object.id,
      layer: 'vehicles',
      kind: object.kind,
      mapObject: object,
    }
    mesh.metadata = { [STUDIO_METADATA_KEY]: metadata }
  }

  private createBuildingObjectMesh(
    scene: Scene,
    root: TransformNode,
    object: MapObject,
  ): void {
    const props = parseBuildingProperties(object.properties)
    if (!props) {
      return
    }

    const definition = getBuildingTypeDefinition(props.buildingType)
    const metadata: StudioMeshMetadata = {
      objectId: object.id,
      layer: 'buildings',
      kind: object.kind,
      mapObject: object,
    }

    const node = createBuildingPlaceholder(
      scene,
      `studio_${object.id}`,
      definition,
      metadata,
    )
    node.parent = root
    positionBuildingRoot(
      node,
      object.transform.position,
      object.transform.rotationY ?? 0,
    )
  }

  private createVegetationObjectMesh(
    scene: Scene,
    root: TransformNode,
    object: MapObject,
  ): void {
    const props = parseVegetationProperties(object.properties)
    if (!props) {
      return
    }

    const definition = getVegetationTypeDefinition(props.vegetationType)
    const metadata: StudioMeshMetadata = {
      objectId: object.id,
      layer: 'vegetation',
      kind: object.kind,
      mapObject: object,
    }

    const node = createVegetationPlaceholder(
      scene,
      `studio_${object.id}`,
      definition,
      metadata,
    )
    node.parent = root
    positionVegetationRoot(
      node,
      object.transform.position,
      object.transform.rotationY ?? 0,
    )
  }

  private createRoadObjectMesh(
    scene: Scene,
    root: TransformNode,
    object: MapObject,
    map: WorldMapDocument,
  ): void {
    const props = parseRoadProperties(object.properties)
    if (!props) {
      return
    }

    const sampler = this.createTerrainHeightSampler(map)
    const mesh = createRoadRibbonMesh(
      scene,
      `studio_${object.id}`,
      props.points,
      props.roadKind,
      sampler,
      { map, roadId: object.id },
    )
    if (!mesh) {
      return
    }

    mesh.parent = root
    const metadata: StudioMeshMetadata = {
      objectId: object.id,
      layer: 'roads',
      kind: 'road',
      mapObject: object,
    }
    mesh.metadata = { [STUDIO_METADATA_KEY]: metadata }
  }

  snapRoadPoints(
    map: WorldMapDocument,
    points: readonly RoadControlPoint[],
    roadKind?: RoadKind,
  ): RoadControlPoint[] {
    const sampler = this.createTerrainHeightSampler(map)
    return snapRoadPointsToTerrain(points, sampler, roadKind ?? 'field_path')
  }

  createTerrainHeightSampler(
    map: WorldMapDocument,
  ): (worldX: number, worldZ: number) => number {
    const ground = map.objects.find((entry) => entry.id === 'terrain_ground')
    const field = ensureTerrainHeightfield(map.terrain)
    const originX = ground?.transform.position.x ?? 0
    const originZ = ground?.transform.position.z ?? 0
    const baseY = ground?.transform.position.y ?? 0
    return (worldX: number, worldZ: number) =>
      sampleTerrainHeightBilinear(field, originX, originZ, baseY, worldX, worldZ)
  }

  sampleTerrainPoint(
    map: WorldMapDocument,
    worldX: number,
    worldZ: number,
  ): RoadControlPoint {
    const ground = map.objects.find((entry) => entry.id === 'terrain_ground')
    const field = ensureTerrainHeightfield(map.terrain)
    const originX = ground?.transform.position.x ?? 0
    const originZ = ground?.transform.position.z ?? 0
    const baseY = ground?.transform.position.y ?? 0
    return applyTerrainHeightToPoint(
      field,
      originX,
      originZ,
      baseY,
      worldX,
      worldZ,
      ROAD_SURFACE_OFFSET,
    )
  }

  refreshRoadMesh(
    scene: Scene,
    map: WorldMapDocument,
    roadId: string,
    pointsOverride?: readonly RoadControlPoint[],
  ): void {
    this.lastMap = map
    const object = map.objects.find((entry) => entry.id === roadId)
    if (!object) {
      return
    }
    if (pointsOverride) {
      this.upsertRoadMeshFromPoints(scene, object, map, pointsOverride)
      return
    }
    this.upsertObjectMesh(scene, object)
  }

  private upsertRoadMeshFromPoints(
    scene: Scene,
    object: MapObject,
    map: WorldMapDocument,
    points: readonly RoadControlPoint[],
  ): void {
    const props = parseRoadProperties(object.properties)
    if (!props) {
      return
    }

    const root =
      this.rootNode ??
      (scene.getTransformNodeByName('studio_map_root') as TransformNode | null)
    if (!root) {
      return
    }

    const existing = findStudioMeshByObjectId(scene, object.id)
    existing?.dispose(false, true)

    const sampler = this.createTerrainHeightSampler(map)
    const mesh = createRoadRibbonMesh(
      scene,
      `studio_${object.id}`,
      points,
      props.roadKind,
      sampler,
      { map, roadId: object.id },
    )
    if (!mesh) {
      return
    }

    mesh.parent = root
    mesh.metadata = {
      [STUDIO_METADATA_KEY]: {
        objectId: object.id,
        layer: 'roads',
        kind: 'road',
        mapObject: object,
      },
    }
  }

  refreshRoadDraftMesh(
    scene: Scene,
    map: WorldMapDocument,
    points: readonly RoadControlPoint[],
    roadKind: RoadKind,
    draftId = '__road_draft__',
  ): void {
    const existing = findStudioMeshByObjectId(scene, draftId)
    existing?.dispose(false, true)

    if (points.length < 2) {
      return
    }

    const root =
      this.rootNode ??
      (scene.getTransformNodeByName('studio_map_root') as TransformNode | null)
    if (!root) {
      return
    }

    const sampler = this.createTerrainHeightSampler(map)
    const mesh = createRoadRibbonMesh(
      scene,
      `studio_${draftId}`,
      points,
      roadKind,
      sampler,
      { map, roadId: draftId },
    )
    if (!mesh) {
      return
    }

    mesh.parent = root
    mesh.metadata = {
      [STUDIO_METADATA_KEY]: {
        objectId: draftId,
        layer: 'roads',
        kind: 'road_draft',
        mapObject: {
          id: draftId,
          layer: 'roads',
          kind: 'road_draft',
          transform: { position: { x: 0, y: 0, z: 0 } },
        },
      },
    }
  }

  disposeRoadDraftMesh(scene: Scene): void {
    findStudioMeshByObjectId(scene, '__road_draft__')?.dispose(false, true)
  }

  sampleFieldSurfaceY(
    map: WorldMapDocument,
    worldX: number,
    worldZ: number,
  ): number {
    return computeFieldSurfaceY(map, worldX, worldZ)
  }

  refreshParcelDraftMesh(
    scene: Scene,
    rect: ParcelRect,
    surfaceY: number,
    isValid: boolean,
  ): void {
    findStudioMeshByObjectId(scene, PARCEL_DRAFT_ID)?.dispose(false, true)

    const root =
      this.rootNode ??
      (scene.getTransformNodeByName('studio_map_root') as TransformNode | null)
    if (!root) {
      return
    }

    const mesh = MeshBuilder.CreateBox(
      `studio_${PARCEL_DRAFT_ID}`,
      {
        width: Math.max(rect.width, 0.1),
        height: FIELD_SURFACE_THICKNESS,
        depth: Math.max(rect.depth, 0.1),
      },
      scene,
    )
    mesh.parent = root
    mesh.position = new Vector3(rect.centerX, surfaceY, rect.centerZ)
    mesh.isPickable = false
    mesh.renderingGroupId = 2

    const material = new StandardMaterial(`mat_${PARCEL_DRAFT_ID}`, scene)
    const color = isValid
      ? new Color3(0.35, 0.72, 0.32)
      : new Color3(0.85, 0.28, 0.22)
    material.diffuseColor = color
    material.emissiveColor = color.scale(0.35)
    material.alpha = 0.55
    material.disableLighting = true
    mesh.material = material

    mesh.metadata = {
      [STUDIO_METADATA_KEY]: {
        objectId: PARCEL_DRAFT_ID,
        layer: 'fields',
        kind: 'parcel_draft',
        mapObject: {
          id: PARCEL_DRAFT_ID,
          layer: 'fields',
          kind: 'parcel_draft',
          transform: { position: { x: rect.centerX, y: surfaceY, z: rect.centerZ } },
        },
      },
    }
  }

  disposeParcelDraftMesh(scene: Scene): void {
    findStudioMeshByObjectId(scene, PARCEL_DRAFT_ID)?.dispose(false, true)
  }

  sampleVegetationGroundY(
    map: WorldMapDocument,
    worldX: number,
    worldZ: number,
  ): number {
    return computeVegetationGroundY(map, worldX, worldZ)
  }

  refreshVegetationPreviewMesh(
    scene: Scene,
    definition: VegetationTypeDefinition,
    worldX: number,
    surfaceY: number,
    worldZ: number,
  ): void {
    disposeVegetationNode(scene, VEGETATION_PREVIEW_ID)

    const root =
      this.rootNode ??
      (scene.getTransformNodeByName('studio_map_root') as TransformNode | null)
    if (!root) {
      return
    }

    const metadata: StudioMeshMetadata = {
      objectId: VEGETATION_PREVIEW_ID,
      layer: 'vegetation',
      kind: 'preview',
      mapObject: {
        id: VEGETATION_PREVIEW_ID,
        layer: 'vegetation',
        kind: 'preview',
        transform: { position: { x: worldX, y: surfaceY, z: worldZ } },
      },
    }

    const node = createVegetationPlaceholder(
      scene,
      `studio_${VEGETATION_PREVIEW_ID}`,
      definition,
      metadata,
      { preview: true },
    )
    node.parent = root
    positionVegetationRoot(node, { x: worldX, y: surfaceY, z: worldZ }, 0)
  }

  disposeVegetationPreviewMesh(scene: Scene): void {
    disposeVegetationNode(scene, VEGETATION_PREVIEW_ID)
  }

  sampleBuildingGroundY(
    map: WorldMapDocument,
    worldX: number,
    worldZ: number,
  ): number {
    return computeBuildingGroundY(map, worldX, worldZ)
  }

  refreshBuildingPreviewMesh(
    scene: Scene,
    definition: BuildingTypeDefinition,
    worldX: number,
    surfaceY: number,
    worldZ: number,
    rotationY: number,
  ): void {
    disposeBuildingPreviewNode(scene)

    const root =
      this.rootNode ??
      (scene.getTransformNodeByName('studio_map_root') as TransformNode | null)
    if (!root) {
      return
    }

    const metadata: StudioMeshMetadata = {
      objectId: BUILDING_PREVIEW_ID,
      layer: 'buildings',
      kind: 'preview',
      mapObject: {
        id: BUILDING_PREVIEW_ID,
        layer: 'buildings',
        kind: 'preview',
        transform: { position: { x: worldX, y: surfaceY, z: worldZ }, rotationY },
      },
    }

    const node = createBuildingPlaceholder(
      scene,
      `studio_${BUILDING_PREVIEW_ID}`,
      definition,
      metadata,
      { preview: true },
    )
    node.parent = root
    positionBuildingRoot(node, { x: worldX, y: surfaceY, z: worldZ }, rotationY)
  }

  disposeBuildingPreviewMesh(scene: Scene): void {
    disposeBuildingPreviewNode(scene)
  }

  sampleWaterSurfaceY(
    map: WorldMapDocument,
    worldX: number,
    worldZ: number,
  ): number {
    return computeWaterSurfaceY(map, worldX, worldZ)
  }

  sampleWaterPoint(
    map: WorldMapDocument,
    worldX: number,
    worldZ: number,
  ): WaterControlPoint {
    const y = computeWaterSurfaceY(map, worldX, worldZ)
    return { x: worldX, y, z: worldZ }
  }

  refreshWaterSplineDraftMesh(
    scene: Scene,
    map: WorldMapDocument,
    points: readonly WaterControlPoint[],
    waterType: WaterTypeId,
  ): void {
    findStudioMeshByObjectId(scene, WATER_SPLINE_DRAFT_ID)?.dispose(false, true)
    if (points.length < 2) {
      return
    }

    const root =
      this.rootNode ??
      (scene.getTransformNodeByName('studio_map_root') as TransformNode | null)
    if (!root) {
      return
    }

    const definition = getWaterTypeDefinition(waterType)
    const sampler = this.createTerrainHeightSampler(map)
    const mesh = createWaterRibbonMesh(
      scene,
      `studio_${WATER_SPLINE_DRAFT_ID}`,
      points,
      definition,
      sampler,
      true,
    )
    if (!mesh) {
      return
    }

    mesh.parent = root
    mesh.metadata = {
      [STUDIO_METADATA_KEY]: {
        objectId: WATER_SPLINE_DRAFT_ID,
        layer: 'water',
        kind: 'preview',
        mapObject: {
          id: WATER_SPLINE_DRAFT_ID,
          layer: 'water',
          kind: 'preview',
          transform: { position: { x: 0, y: 0, z: 0 } },
        },
      },
    }
  }

  refreshWaterAreaDraftMesh(
    scene: Scene,
    ellipse: WaterEllipse,
    surfaceY: number,
    waterType: WaterTypeId,
  ): void {
    findStudioMeshByObjectId(scene, WATER_AREA_DRAFT_ID)?.dispose(false, true)

    const root =
      this.rootNode ??
      (scene.getTransformNodeByName('studio_map_root') as TransformNode | null)
    if (!root) {
      return
    }

    const definition = getWaterTypeDefinition(waterType)
    const mesh = createWaterAreaMesh(
      scene,
      `studio_${WATER_AREA_DRAFT_ID}`,
      ellipse,
      surfaceY,
      definition,
      true,
    )
    mesh.parent = root
    mesh.metadata = {
      [STUDIO_METADATA_KEY]: {
        objectId: WATER_AREA_DRAFT_ID,
        layer: 'water',
        kind: 'preview',
        mapObject: {
          id: WATER_AREA_DRAFT_ID,
          layer: 'water',
          kind: 'preview',
          transform: { position: { x: ellipse.centerX, y: surfaceY, z: ellipse.centerZ } },
        },
      },
    }
  }

  disposeWaterDraftMeshes(scene: Scene): void {
    findStudioMeshByObjectId(scene, WATER_SPLINE_DRAFT_ID)?.dispose(false, true)
    findStudioMeshByObjectId(scene, WATER_AREA_DRAFT_ID)?.dispose(false, true)
  }

  refreshValidationMarkers(
    scene: Scene,
    report: MapValidationReport | null,
    focusIssueId: string | null,
  ): void {
    this.disposeValidationMarkers(scene)
    if (!report || report.issues.length === 0) {
      return
    }

    const root = new TransformNode(VALIDATION_OVERLAY_ID, scene)
    const severityColors = {
      error: new Color3(0.95, 0.25, 0.25),
      warn: new Color3(0.95, 0.72, 0.2),
      info: new Color3(0.35, 0.65, 0.95),
    } as const

    for (const issue of report.issues) {
      if (!issue.position) {
        continue
      }
      const focused = issue.id === focusIssueId
      const mesh = MeshBuilder.CreateSphere(
        `validation_${issue.id}`,
        { diameter: focused ? 2.4 : 1.6, segments: 10 },
        scene,
      )
      mesh.parent = root
      mesh.position = new Vector3(
        issue.position.x,
        issue.position.y + 1.2,
        issue.position.z,
      )
      const material = new StandardMaterial(`validation_mat_${issue.id}`, scene)
      const color = severityColors[issue.severity]
      material.diffuseColor = color
      material.emissiveColor = color.scale(focused ? 0.55 : 0.35)
      material.alpha = focused ? 0.95 : 0.78
      mesh.material = material
      mesh.metadata = {
        [STUDIO_METADATA_KEY]: {
          objectId: `validation_${issue.id}`,
          layer: 'debug',
          kind: 'validation_marker',
          mapObject: {
            id: `validation_${issue.id}`,
            layer: 'debug',
            kind: 'validation_marker',
            transform: { position: issue.position },
          },
        },
      }
    }
  }

  disposeValidationMarkers(scene: Scene): void {
    scene.getTransformNodeByName(VALIDATION_OVERLAY_ID)?.dispose(false, true)
  }

  upsertObjectMesh(scene: Scene, object: MapObject): void {
    const root =
      this.rootNode ??
      (scene.getTransformNodeByName('studio_map_root') as TransformNode | null)
    if (!root) {
      return
    }

    const existing = findStudioMeshByObjectId(scene, object.id)
    existing?.dispose(false, true)
    if (object.layer === 'vegetation') {
      disposeVegetationNode(scene, object.id)
    }
    if (object.layer === 'buildings' && parseBuildingProperties(object.properties)) {
      disposeBuildingNode(scene, object.id)
    }
    if (!this.lastMap) {
      return
    }
    this.createObjectMesh(scene, root, object, this.lastMap)
  }

  refreshTerrainMesh(
    scene: Scene,
    map: WorldMapDocument,
    options?: SyncTerrainMeshOptions,
  ): void {
    this.lastMap = map
    const mesh = findStudioMeshByObjectId(scene, 'terrain_ground')
    const ground = map.objects.find((entry) => entry.id === 'terrain_ground')
    if (!mesh || !ground) {
      return
    }
    syncTerrainMesh(mesh as Mesh, map.terrain, ground.transform.position.y, options)
  }

  refreshTerrainFromField(
    scene: Scene,
    field: TerrainHeightfield,
    baseY: number,
    options?: SyncTerrainMeshOptions,
  ): void {
    const mesh = findStudioMeshByObjectId(scene, 'terrain_ground')
    if (!mesh) {
      return
    }
    syncTerrainMeshField(
      mesh as Mesh,
      field,
      baseY,
      options,
    )
  }
}

export function findStudioMeshByObjectId(
  scene: Scene,
  objectId: string,
): AbstractMesh | null {
  for (const mesh of scene.meshes) {
    const metadata = getStudioMetadata(mesh)
    if (metadata?.objectId === objectId) {
      return mesh
    }
  }
  return null
}

export function getStudioMetadata(mesh: AbstractMesh): StudioMeshMetadata | null {
  const raw = mesh.metadata?.[STUDIO_METADATA_KEY] as
    | StudioMeshMetadata
    | undefined
  return raw ?? null
}
