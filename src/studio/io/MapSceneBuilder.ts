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
  ): RoadControlPoint[] {
    const sampler = this.createTerrainHeightSampler(map)
    return snapRoadPointsToTerrain(points, sampler)
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

  refreshRoadMesh(scene: Scene, map: WorldMapDocument, roadId: string): void {
    this.lastMap = map
    const object = map.objects.find((entry) => entry.id === roadId)
    if (!object) {
      return
    }
    this.upsertObjectMesh(scene, object)
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

  upsertObjectMesh(scene: Scene, object: MapObject): void {
    const root =
      this.rootNode ??
      (scene.getTransformNodeByName('studio_map_root') as TransformNode | null)
    if (!root) {
      return
    }

    const existing = findStudioMeshByObjectId(scene, object.id)
    existing?.dispose(false, true)
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
