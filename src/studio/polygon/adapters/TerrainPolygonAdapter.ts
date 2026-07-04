import type { Scene } from '@babylonjs/core'
import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { MapPolygonPoint } from '@/types/world-map.ts'
import type { PolygonObjectAdapter, PolygonEditorTool } from '@/studio/polygon/PolygonEditorTypes.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import {
  pickTerrainPlacementPoint,
  pickTerrainPolygonObjectId,
} from '@/studio/terrain/TerrainPolygonPick.ts'
import { getFieldPolygonPoints } from '@/studio/parcel/ParcelPolygon.ts'
import { validatePolygonGeometry } from '@/studio/polygon/PolygonValidation.ts'
import { polygonCentroid } from '@/studio/polygon/PolygonGeometryUtils.ts'
import { sampleFieldSurfaceY } from '@/studio/parcel/parcelSurface.ts'

export class TerrainPolygonAdapter implements PolygonObjectAdapter {
  readonly objectType = 'terrain_polygon'
  readonly previewId = '__terrain_polygon_preview__'
  private readonly store: StudioStore

  constructor(store: StudioStore) {
    this.store = store
  }

  isActiveModule(activeModuleId: string): boolean {
    return activeModuleId === 'terrain'
  }

  getTool(): PolygonEditorTool {
    return this.store.getSnapshot().terrainPolygonTool
  }

  pickGround(scene: Scene, canvasX: number, canvasY: number) {
    return pickTerrainPlacementPoint(scene, canvasX, canvasY)
  }

  pickObject(scene: Scene, canvasX: number, canvasY: number): string | null {
    return pickTerrainPolygonObjectId(scene, canvasX, canvasY)
  }

  getMap(): WorldMapDocument {
    return this.store.getMap()
  }

  getObjectPolygon(object: MapObject): MapPolygonPoint[] | null {
    return getFieldPolygonPoints(object)
  }

  getPreviewSurfaceY(points: readonly MapPolygonPoint[]): number {
    const centroid = polygonCentroid(points)
    return sampleFieldSurfaceY(this.store.getMap(), centroid.x, centroid.z)
  }

  validatePolygon(
    map: WorldMapDocument,
    points: readonly MapPolygonPoint[],
    excludeObjectId?: string,
  ) {
    return validatePolygonGeometry(map, points, excludeObjectId)
  }

  createFromPolygon(points: readonly MapPolygonPoint[]): MapObject | null {
    return this.store.createTerrainPolygon(points)
  }

  updatePolygon(
    objectId: string,
    points: readonly MapPolygonPoint[],
    options?: { checkpoint?: boolean },
  ): boolean {
    return this.store.updateTerrainPolygon(objectId, points, options)
  }

  movePolygon(_objectId: string, _deltaX: number, _deltaZ: number): boolean {
    return false
  }

  rotatePolygon(_objectId: string, _nextRotationY: number): boolean {
    return false
  }

  deleteObject(objectId: string): boolean {
    return this.store.deleteTerrainPolygon(objectId)
  }

  duplicateObject(objectId: string): MapObject | null {
    return this.store.duplicateTerrainPolygon(objectId)
  }

  selectObject(object: MapObject | null): void {
    this.store.selectObject(object)
  }

  findObject(objectId: string): MapObject | null {
    return this.store.findObject(objectId)
  }

  checkpointHistory(label: string): void {
    this.store.checkpointHistory(label)
  }

  logValidationError(message: string): void {
    this.store.log('warn', message)
  }
}
