import type { Scene } from '@babylonjs/core'
import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { MapPolygonPoint } from '@/types/world-map.ts'
import type { PolygonObjectAdapter, PolygonEditorTool } from '@/studio/polygon/PolygonEditorTypes.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import {
  pickFieldObjectId,
  pickParcelPlacementPoint,
} from '@/studio/parcel/ParcelPlacementPick.ts'
import { validateParcelPolygon } from '@/studio/parcel/ParcelValidation.ts'
import { getFieldPolygonPoints } from '@/studio/parcel/ParcelPolygon.ts'
import { sampleFieldSurfaceY } from '@/studio/parcel/parcelSurface.ts'
import { createFieldParcelFromPolygon } from '@/studio/parcel/parcelObject.ts'
import { polygonCentroid } from '@/studio/polygon/PolygonGeometryUtils.ts'

export class ParcelPolygonAdapter implements PolygonObjectAdapter {
  readonly objectType = 'parcel'
  readonly previewId = '__parcel_polygon_preview__'
  private readonly store: StudioStore

  constructor(store: StudioStore) {
    this.store = store
  }

  isActiveModule(activeModuleId: string): boolean {
    return activeModuleId === 'parcels'
  }

  getTool(): PolygonEditorTool {
    return this.store.getSnapshot().parcelTool
  }

  pickGround(scene: Scene, canvasX: number, canvasY: number) {
    return pickParcelPlacementPoint(scene, canvasX, canvasY)
  }

  pickObject(scene: Scene, canvasX: number, canvasY: number): string | null {
    return pickFieldObjectId(scene, canvasX, canvasY)
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
    return validateParcelPolygon(map, points, excludeObjectId)
  }

  createFromPolygon(points: readonly MapPolygonPoint[]): MapObject | null {
    const snapshot = this.store.getSnapshot()
    this.store.checkpointHistory('place')
    const centroid = polygonCentroid(points)
    const surfaceY = sampleFieldSurfaceY(this.store.getMap(), centroid.x, centroid.z)
    const field = createFieldParcelFromPolygon(points, this.store.getMap(), {
      parcelBlock: snapshot.parcelBlock,
      parcelType: snapshot.parcelType,
      fertility: snapshot.parcelFertility,
      surfaceY,
    })
    this.store.appendFieldParcel(field)
    return field
  }

  updatePolygon(
    objectId: string,
    points: readonly MapPolygonPoint[],
    options?: { checkpoint?: boolean },
  ): boolean {
    return this.store.updateFieldParcelPolygon(objectId, points, options)
  }

  movePolygon(_objectId: string, _deltaX: number, _deltaZ: number): boolean {
    return false
  }

  rotatePolygon(_objectId: string, _nextRotationY: number): boolean {
    return false
  }

  deleteObject(objectId: string): boolean {
    return this.store.deleteField(objectId)
  }

  duplicateObject(objectId: string): MapObject | null {
    return this.store.duplicateField(objectId)
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
