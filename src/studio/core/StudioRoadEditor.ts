import type { Scene } from '@babylonjs/core'
import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  type Mesh,
} from '@babylonjs/core'
import type { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import { STUDIO_ROAD_POINT_KEY, type StudioRoadPointMetadata } from '@/studio/io/MapSceneBuilder.ts'
import type { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { getRoadKind, getRoadPoints } from '@/studio/road/roadObject.ts'
import { resolveDraftExtension } from '@/studio/road/RoadExtension.ts'
import {
  createJunctionHandleMesh,
  pickRoadPlacementPoint,
  RoadSnapPreview,
} from '@/studio/road/RoadPlacementPick.ts'
import { isJunctionPoint, previewSnap, trySnapRoadPoint } from '@/studio/road/RoadJunction.ts'
import type { RoadControlPoint, RoadKind } from '@/types/road.ts'

const HANDLE_RADIUS = 0.35
const DRAFT_ROAD_ID = '__road_draft__'

export interface StudioRoadEditorDeps {
  store: StudioStore
  cameraController: StudioCameraController
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  requestRender: () => void
  onRefresh: () => void
}

export class StudioRoadEditor {
  private readonly canvas: HTMLCanvasElement
  private readonly deps: StudioRoadEditorDeps
  private readonly handles = new Map<string, Mesh>()
  private readonly snapPreview = new RoadSnapPreview()
  private attached = false
  private dragging = false
  private dragRoadId: string | null = null
  private dragPointIndex = -1
  private dragPoints: RoadControlPoint[] = []

  constructor(canvas: HTMLCanvasElement, deps: StudioRoadEditorDeps) {
    this.canvas = canvas
    this.deps = deps
  }

  attach(): void {
    if (this.attached) {
      return
    }
    this.attached = true
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.canvas.addEventListener('pointerup', this.onPointerUp)
    this.canvas.addEventListener('pointercancel', this.onPointerUp)
  }

  detach(): void {
    if (!this.attached) {
      return
    }
    this.attached = false
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointercancel', this.onPointerUp)
    this.disposeHandles()
    this.snapPreview.dispose()
    this.endDrag()
  }

  syncModuleState(scene: Scene | null): void {
    if (!scene || this.deps.store.getSnapshot().activeModuleId !== 'roads') {
      this.disposeHandles()
      this.snapPreview.dispose()
      return
    }
    this.syncHandles(scene)
    this.syncDraftPreview(scene)
  }

  private syncDraftPreview(scene: Scene): void {
    const { roadDraft } = this.deps.store.getSnapshot()
    if (!roadDraft || roadDraft.points.length < 2) {
      this.deps.mapSceneBuilder.disposeRoadDraftMesh(scene)
      return
    }

    const map = this.deps.store.getMap()
    const extension = resolveDraftExtension(map, roadDraft)
    if (extension && extension.points.length >= 2) {
      this.deps.mapSceneBuilder.disposeRoadDraftMesh(scene)
      this.deps.mapSceneBuilder.refreshRoadMesh(
        scene,
        map,
        extension.anchorId,
        extension.points,
      )
      return
    }

    this.deps.mapSceneBuilder.refreshRoadDraftMesh(
      scene,
      map,
      roadDraft.points,
      roadDraft.roadKind,
    )
  }

  private syncHandles(scene: Scene): void {
    const snapshot = this.deps.store.getSnapshot()
    const wanted = new Set<string>()

    const addHandles = (
      roadId: string,
      points: readonly RoadControlPoint[],
      isDraft: boolean,
    ) => {
      for (let index = 0; index < points.length; index++) {
        const key = `${roadId}:${index}`
        wanted.add(key)
        const point = points[index]
        const junction = isJunctionPoint(point)
        let handle = this.handles.get(key)
        const handleIsJunction = Boolean(handle?.name.startsWith('road_junction_'))

        if (handle && junction !== handleIsJunction) {
          handle.dispose(false, true)
          this.handles.delete(key)
          handle = undefined
        }

        if (!handle || handle.isDisposed()) {
          if (junction) {
            handle = createJunctionHandleMesh(scene, key, point.junction!.join)
          } else {
            handle = MeshBuilder.CreateSphere(
              `road_handle_${key}`,
              { diameter: HANDLE_RADIUS * 2, segments: 10 },
              scene,
            )
            handle.isPickable = true
            handle.renderingGroupId = 3
            const material = new StandardMaterial(`road_handle_mat_${key}`, scene)
            material.diffuseColor = isDraft
              ? new Color3(0.95, 0.85, 0.35)
              : new Color3(0.55, 0.75, 0.95)
            material.emissiveColor = material.diffuseColor.scale(0.35)
            material.disableLighting = true
            handle.material = material
          }
          this.handles.set(key, handle)
        }

        handle.position = new Vector3(point.x, point.y + 0.15, point.z)
        const selected =
          snapshot.roadSelection?.roadId === roadId &&
          snapshot.roadSelection.pointIndex === index

        if (!junction && handle.material instanceof StandardMaterial) {
          handle.material.diffuseColor = isDraft
            ? new Color3(0.95, 0.85, 0.35)
            : new Color3(0.55, 0.75, 0.95)
          handle.material.emissiveColor = selected
            ? new Color3(0.9, 0.95, 0.5)
            : isDraft
              ? new Color3(0.24, 0.2, 0.08)
              : new Color3(0.14, 0.18, 0.24)
        }

        handle.scaling = new Vector3(
          selected ? 1.25 : 1,
          selected ? 1.25 : 1,
          selected ? 1.25 : 1,
        )
        const metadata: StudioRoadPointMetadata = {
          roadId,
          pointIndex: index,
          isDraft,
        }
        handle.metadata = { [STUDIO_ROAD_POINT_KEY]: metadata }
      }
    }

    for (const object of this.deps.store.getMap().objects) {
      if (object.layer !== 'roads' || object.kind !== 'road') {
        continue
      }
      const points = getRoadPoints(object)
      if (!points) {
        continue
      }
      const snapped = this.deps.mapSceneBuilder.snapRoadPoints(
        this.deps.store.getMap(),
        points,
        getRoadKind(object) ?? undefined,
      )
      addHandles(object.id, snapped, false)
    }

    if (snapshot.roadDraft) {
      const draftSnapped = this.deps.mapSceneBuilder.snapRoadPoints(
        this.deps.store.getMap(),
        snapshot.roadDraft.points,
        snapshot.roadDraft.roadKind,
      )
      addHandles(DRAFT_ROAD_ID, draftSnapped, true)
    }

    for (const [key, handle] of this.handles) {
      if (!wanted.has(key)) {
        handle.dispose(false, true)
        this.handles.delete(key)
      }
    }
  }

  private disposeHandles(): void {
    for (const handle of this.handles.values()) {
      handle.dispose(false, true)
    }
    this.handles.clear()
    const scene = this.deps.getScene()
    if (scene) {
      this.deps.mapSceneBuilder.disposeRoadDraftMesh(scene)
    }
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return
    }
    if (this.deps.store.getSnapshot().activeModuleId !== 'roads') {
      return
    }

    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const coords = this.canvasCoords(event)
    const { roadTool } = this.deps.store.getSnapshot()

    if (roadTool === 'select') {
      const handle = this.pickRoadHandle(scene, coords.x, coords.y)
      if (!handle) {
        this.deps.store.clearRoadSelection()
        this.syncModuleState(scene)
        this.deps.requestRender()
        return
      }

      event.preventDefault()
      this.canvas.setPointerCapture(event.pointerId)
      this.deps.cameraController.getCamera().detachControl()
      this.canvas.classList.add('studio-shell__canvas--manipulating')

      const meta = handle.metadata?.[STUDIO_ROAD_POINT_KEY] as
        | StudioRoadPointMetadata
        | undefined
      if (!meta) {
        return
      }

      this.dragging = true
      this.dragRoadId = meta.roadId
      this.dragPointIndex = meta.pointIndex
      if (meta.isDraft || meta.roadId === DRAFT_ROAD_ID) {
        const draft = this.deps.store.getSnapshot().roadDraft
        this.dragPoints = draft ? [...draft.points] : []
        this.deps.store.selectRoadPoint(DRAFT_ROAD_ID, meta.pointIndex)
      } else {
        const points = getRoadPoints(this.deps.store.findObject(meta.roadId)!)
        this.dragPoints = points ? [...points] : []
        this.deps.store.selectRoadPoint(meta.roadId, meta.pointIndex)
      }
      return
    }

    const hit = pickRoadPlacementPoint(scene, coords.x, coords.y)
    if (!hit) {
      return
    }

    event.preventDefault()
    const { roadKind } = this.deps.store.getSnapshot()
    const point = this.resolvePlacedPoint(hit.x, hit.z, roadKind)
    this.deps.store.addRoadDraftPoint(point)
    this.snapPreview.hide()
    this.syncModuleState(scene)
    this.deps.requestRender()
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const coords = this.canvasCoords(event)
    const snapshot = this.deps.store.getSnapshot()

    if (!this.dragging && snapshot.roadTool === 'draw') {
      this.updateSnapPreview(scene, coords.x, coords.y)
      return
    }

    if (!this.dragging) {
      return
    }

    const hit = pickRoadPlacementPoint(scene, coords.x, coords.y)
    if (!hit || this.dragPointIndex < 0) {
      return
    }

    event.preventDefault()
    const roadKind = this.resolveRoadKindForDrag()
    let point = this.deps.mapSceneBuilder.sampleTerrainPoint(
      this.deps.store.getMap(),
      hit.x,
      hit.z,
    )
    point = trySnapRoadPoint(
      this.deps.store.getMap(),
      point,
      roadKind,
      this.dragRoadId ? [this.dragRoadId] : [],
    )
    const nextPoints = [...this.dragPoints]
    nextPoints[this.dragPointIndex] = point
    this.dragPoints = nextPoints

    if (this.dragRoadId === DRAFT_ROAD_ID) {
      this.deps.store.updateRoadDraftPoints(nextPoints)
      this.syncModuleState(scene)
    } else if (this.dragRoadId) {
      this.deps.store.updateRoadPoints(this.dragRoadId, nextPoints)
      this.deps.mapSceneBuilder.refreshRoadMesh(
        scene,
        this.deps.store.getMap(),
        this.dragRoadId,
      )
      this.syncHandles(scene)
    }
    this.deps.requestRender()
  }

  private updateSnapPreview(scene: Scene, canvasX: number, canvasY: number): void {
    const hit = pickRoadPlacementPoint(scene, canvasX, canvasY)
    if (!hit) {
      this.snapPreview.hide()
      this.deps.requestRender()
      return
    }

    const { roadKind } = this.deps.store.getSnapshot()
    const map = this.deps.store.getMap()
    const preview = previewSnap(map, hit.x, hit.z, roadKind)
    if (!preview) {
      this.snapPreview.hide()
      this.deps.requestRender()
      return
    }

    const terrainPoint = this.deps.mapSceneBuilder.sampleTerrainPoint(
      map,
      preview.snap.x,
      preview.snap.z,
    )
    this.snapPreview.update(scene, terrainPoint, preview.join)
    this.deps.requestRender()
  }

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.dragging) {
      return
    }

    if (this.dragRoadId && this.dragRoadId !== DRAFT_ROAD_ID) {
      this.deps.onRefresh()
    }

    this.endDrag()
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
  }

  private endDrag(): void {
    this.dragging = false
    this.dragRoadId = null
    this.dragPointIndex = -1
    this.dragPoints = []
    this.canvas.classList.remove('studio-shell__canvas--manipulating')
    try {
      this.deps.cameraController.getCamera().attachControl(this.canvas, false)
    } catch {
      // Camera may be disposed during teardown.
    }
  }

  private resolvePlacedPoint(
    worldX: number,
    worldZ: number,
    roadKind: RoadKind,
  ): RoadControlPoint {
    const map = this.deps.store.getMap()
    const point = this.deps.mapSceneBuilder.sampleTerrainPoint(map, worldX, worldZ)
    return trySnapRoadPoint(map, point, roadKind)
  }

  private resolveRoadKindForDrag(): RoadKind {
    if (this.dragRoadId === DRAFT_ROAD_ID) {
      return (
        this.deps.store.getSnapshot().roadDraft?.roadKind ??
        this.deps.store.getSnapshot().roadKind
      )
    }
    if (this.dragRoadId) {
      const object = this.deps.store.findObject(this.dragRoadId)
      const kind = object ? getRoadKind(object) : null
      if (kind) {
        return kind
      }
    }
    return this.deps.store.getSnapshot().roadKind
  }

  private pickRoadHandle(
    scene: Scene,
    canvasX: number,
    canvasY: number,
  ): Mesh | null {
    const pick = scene.pick(canvasX, canvasY, (mesh) => {
      return Boolean(mesh.metadata?.[STUDIO_ROAD_POINT_KEY])
    })
    return (pick?.pickedMesh as Mesh | undefined) ?? null
  }

  private canvasCoords(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }
}

export function isRoadDraftId(roadId: string): boolean {
  return roadId === DRAFT_ROAD_ID
}
