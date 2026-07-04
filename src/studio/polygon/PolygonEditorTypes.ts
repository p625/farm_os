import type { MapObject, MapPolygonPoint } from '@/types/world-map.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'

export type PolygonEditorTool = 'draw' | 'select' | 'edit' | 'rotate'

export type PolygonEditorState =
  | 'idle'
  | 'drawing'
  | 'editing'
  | 'movingVertex'
  | 'movingPolygon'

export interface PolygonValidationResult {
  ok: boolean
  message?: string
}

export interface PolygonPickResult {
  x: number
  z: number
}

export interface PolygonObjectAdapter {
  readonly objectType: string
  readonly previewId: string

  isActiveModule(activeModuleId: string): boolean
  isModuleActive(): boolean
  getTool(): PolygonEditorTool
  setTool(tool: PolygonEditorTool): void
  getSelectedObject(): MapObject | null
  pickGround(scene: import('@babylonjs/core').Scene, canvasX: number, canvasY: number): PolygonPickResult | null
  pickObject(scene: import('@babylonjs/core').Scene, canvasX: number, canvasY: number): string | null
  getMap(): WorldMapDocument
  getObjectPolygon(object: MapObject): MapPolygonPoint[] | null
  getPreviewSurfaceY(points: readonly MapPolygonPoint[]): number
  validatePolygon(
    map: WorldMapDocument,
    points: readonly MapPolygonPoint[],
    excludeObjectId?: string,
  ): PolygonValidationResult
  createFromPolygon(points: readonly MapPolygonPoint[]): MapObject | null
  updatePolygon(objectId: string, points: readonly MapPolygonPoint[], options?: { checkpoint?: boolean }): boolean
  movePolygon(objectId: string, deltaX: number, deltaZ: number): boolean
  rotatePolygon(objectId: string, nextRotationY: number): boolean
  deleteObject(objectId: string): boolean
  duplicateObject(objectId: string): MapObject | null
  selectObject(object: MapObject | null): void
  findObject(objectId: string): MapObject | null
  checkpointHistory(label: string): void
  logValidationError(message: string): void
}

export interface PolygonDrawingSnapshot {
  pointCount: number
  isDrawing: boolean
}
