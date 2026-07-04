import type { Scene } from '@babylonjs/core'
import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { MapPolygonPoint } from '@/types/world-map.ts'
import type { PolygonObjectAdapter, PolygonEditorTool } from '@/studio/polygon/PolygonEditorTypes.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { pickParcelPlacementPoint } from '@/studio/parcel/ParcelPlacementPick.ts'
import { getFieldPolygonPoints } from '@/studio/parcel/ParcelPolygon.ts'
import { validateTerrainBoundaryGeometry } from '@/studio/polygon/PolygonValidation.ts'
import { polygonCentroid } from '@/studio/polygon/PolygonGeometryUtils.ts'
import { sampleFieldSurfaceY } from '@/studio/parcel/parcelSurface.ts'
import { TERRAIN_POLYGON_KIND } from '@/types/terrain-polygon.ts'
import { pickTerrainPolygonObjectId } from '@/studio/terrain/TerrainPolygonPick.ts'

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

  isModuleActive(): boolean {
    const snapshot = this.store.getSnapshot()
    return snapshot.activeModuleId === 'terrain' && snapshot.terrainToolMode === 'polygon'
  }

  getTool(): PolygonEditorTool {
    return this.store.getSnapshot().terrainPolygonTool
  }

  setTool(tool: PolygonEditorTool): void {
    if (tool === 'rotate') {
      return
    }
    this.store.setTerrainPolygonTool(tool)
  }

  getSelectedObject(): MapObject | null {
    const selected = this.store.getSnapshot().selectedObject
    if (!selected || selected.kind !== TERRAIN_POLYGON_KIND) {
      return null
    }
    return selected
  }

  pickGround(scene: Scene, canvasX: number, canvasY: number) {
    return pickParcelPlacementPoint(scene, canvasX, canvasY)
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
    _map: WorldMapDocument,
    points: readonly MapPolygonPoint[],
    _excludeObjectId?: string,
  ) {
    return validateTerrainBoundaryGeometry(points)
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
