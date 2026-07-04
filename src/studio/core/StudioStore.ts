import { patchFieldParcelProperties } from '@/types/parcel.ts'
import type { FieldBlockId } from '@/config/map-01-layout.ts'
import type {
  MapBoxShape,
  MapObject,
  MapVec3,
  StudioLayerId,
  StudioLogEntry,
  WorldMapDocument,
} from '@/types/world-map.ts'
import type { RoadControlPoint, RoadKind } from '@/types/road.ts'
import { createDefaultLayerVisibility } from '@/studio/core/LayerRegistry.ts'
import {
  DEFAULT_TERRAIN_BRUSH,
  type TerrainBrushSettings,
} from '@/studio/terrain/TerrainHeightmap.ts'
import {
  mergeTerrainIntoDocument,
  type TerrainHeightfield,
  ensureTerrainHeightfield,
} from '@/studio/terrain/TerrainHeightmap.ts'
import { createRoadObject, getRoadKind } from '@/studio/road/roadObject.ts'
import { applyJunctionsToAnchorRoads } from '@/studio/road/RoadJunction.ts'
import { tryMergeDraftExtensionIntoAnchor } from '@/studio/road/RoadExtension.ts'
import {
  createFieldParcelFromCorners,
  syncFieldParcelIdCounterFromMap,
} from '@/studio/parcel/parcelObject.ts'
import {
  footprintFromRect,
  parcelRectFromCorners,
} from '@/studio/parcel/ParcelMath.ts'
import { validateParcelFootprint } from '@/studio/parcel/ParcelValidation.ts'
import { sampleFieldSurfaceY } from '@/studio/parcel/parcelSurface.ts'
import {
  createVegetationObject,
  syncVegetationIdCounterFromMap,
} from '@/studio/vegetation/vegetationObject.ts'
import { sampleVegetationGroundY } from '@/studio/vegetation/vegetationSurface.ts'
import {
  DEFAULT_VEGETATION_TYPE,
  getVegetationTypeDefinition,
} from '@/studio/vegetation/VegetationTypePalette.ts'
import type { VegetationTypeId } from '@/types/vegetation.ts'
import {
  createBuildingObject,
  syncBuildingIdCounterFromMap,
} from '@/studio/building/buildingObject.ts'
import { sampleBuildingGroundY } from '@/studio/building/buildingSurface.ts'
import {
  DEFAULT_BUILDING_TYPE,
  getBuildingTotalHeight,
  getBuildingTypeDefinition,
} from '@/studio/building/BuildingTypePalette.ts'
import type { BuildingTypeId } from '@/types/building.ts'
import {
  createWaterAreaObject,
  createWaterSplineObject,
  syncWaterIdCounterFromMap,
} from '@/studio/water/waterObject.ts'
import { sampleWaterSurfaceY } from '@/studio/water/waterSurface.ts'
import {
  DEFAULT_WATER_TYPE,
  getWaterTypeDefinition,
  isAreaWaterType,
  isSplineWaterType,
} from '@/studio/water/WaterTypePalette.ts'
import { waterEllipseFromCorners } from '@/studio/water/WaterAreaMath.ts'
import type { WaterControlPoint, WaterTypeId } from '@/types/water.ts'
import type { MapValidationReport } from '@/types/map-validation.ts'
import { validateWorldMap } from '@/studio/validation/validateMap.ts'
import { exportWorldMapToPackage, suggestStudioPackageId } from '@/studio/export/WorldMapExporter.ts'
import type { ExportPackageOptions } from '@/studio/export/WorldMapExporter.ts'
import {
  deleteStoredMapPackage,
  registerStoredPackageInRegistry,
  saveStoredMapPackage,
} from '@/maps/ExportedMapStorage.ts'
import { defaultMapPackageRegistry } from '@/maps/MapPackageLoader.ts'
import { migrateLegacyBuildings, mapHasLegacyBuildings } from '@/studio/building/migrateLegacyBuildings.ts'
import type { MapPackageSummary } from '@/types/map-package.ts'
import {
  createDefaultBuildingAnchors,
  createDefaultPlacementAnchors,
  createSceneAnchorObject,
  syncAnchorIdCounterFromMap,
} from '@/studio/anchor/anchorObject.ts'
import type { SceneAnchorKind } from '@/types/scene-anchor.ts'
import { getAnchorsForParent } from '@/types/scene-anchor.ts'
import {
  createVehiclePlacementObject,
  syncVehicleIdCounterFromMap,
} from '@/studio/vehicle/vehicleObject.ts'
import {
  allocateMapAttachmentInstanceId,
  allocateMapMachineInstanceId,
} from '@/studio/vehicle/allocatePlacementIds.ts'
import {
  getDefaultStudioPlacementId,
  getStudioPlacementEntry,
} from '@/studio/catalog/StudioPlacementCatalog.ts'
import {
  DEFAULT_VEHICLE_TYPE,
  getVehicleTypeDefinition,
} from '@/studio/vehicle/VehicleTypePalette.ts'
import type { VehiclePlacementTypeId } from '@/types/vehicle-placement.ts'
import { StudioCommandHistory } from '@/studio/core/StudioCommandHistory.ts'
import { duplicateMapObject } from '@/studio/core/studioObjectDuplicate.ts'
import {
  isGameplayParentObject,
  isSceneAnchorObject,
  rotateObjectsWithAnchors,
  translateObjectsWithAnchors,
} from '@/studio/anchor/studioAnchorSync.ts'

export type StudioModuleId =
  | 'transform'
  | 'terrain'
  | 'roads'
  | 'parcels'
  | 'vegetation'
  | 'buildings'
  | 'vehicles'
  | 'water'
  | 'validation'
  | 'export'
export type RoadToolMode = 'draw' | 'select'
export type ParcelToolMode = 'draw' | 'select'
export type VegetationToolMode = 'place' | 'paint' | 'select'
export type BuildingToolMode = 'place' | 'select' | 'anchors'
export type VehicleToolMode = 'place' | 'select' | 'anchors'
export type WaterToolMode = 'draw' | 'select'

export interface ExportMapOptions extends ExportPackageOptions {
  ignoreValidationErrors?: boolean
}

export interface RoadDraft {
  roadKind: RoadKind
  points: RoadControlPoint[]
}

export interface RoadPointSelection {
  roadId: string
  pointIndex: number
}

export const DEFAULT_ROAD_KIND: RoadKind = 'asphalt_narrow'

export interface ParcelDraft {
  cornerA: { x: number; z: number }
  cornerB: { x: number; z: number } | null
}

export const DEFAULT_PARCEL_BLOCK: FieldBlockId = 'A'
export const DEFAULT_PARCEL_FERTILITY = 75

export interface StudioSnapshot {
  map: WorldMapDocument
  selectedObject: MapObject | null
  layerVisibility: Record<StudioLayerId, boolean>
  logs: readonly StudioLogEntry[]
  isDirty: boolean
  activeModuleId: StudioModuleId
  terrainBrush: TerrainBrushSettings
  roadTool: RoadToolMode
  roadKind: RoadKind
  roadDraft: RoadDraft | null
  roadSelection: RoadPointSelection | null
  parcelTool: ParcelToolMode
  parcelBlock: FieldBlockId
  parcelFertility: number
  parcelDraft: ParcelDraft | null
  vegetationTool: VegetationToolMode
  vegetationType: VegetationTypeId
  vegetationRandomRotation: boolean
  buildingTool: BuildingToolMode
  buildingType: BuildingTypeId
  buildingRotationY: number
  buildingSnapRotation: boolean
  vehicleTool: VehicleToolMode
  vehicleType: VehiclePlacementTypeId
  placementEntryId: string
  vehicleRotationY: number
  anchorKind: SceneAnchorKind
  anchorParentId: string | null
  waterTool: WaterToolMode
  waterType: WaterTypeId
  waterSplineDraft: { points: WaterControlPoint[] } | null
  waterAreaDraft: {
    cornerA: { x: number; z: number }
    cornerB: { x: number; z: number } | null
  } | null
  validationReport: MapValidationReport | null
  validationFocusIssueId: string | null
  gameplayDebugEnabled: boolean
  exportedMaps: readonly MapPackageSummary[]
  canUndo: boolean
  canRedo: boolean
}

let logCounter = 0

function createLogId(): string {
  logCounter += 1
  return `log_${logCounter}`
}

export class StudioStore {
  private listeners = new Set<() => void>()
  private map: WorldMapDocument
  private selectedObject: MapObject | null = null
  private layerVisibility: Record<StudioLayerId, boolean>
  private logs: StudioLogEntry[] = []
  private dirty = false
  private activeModuleId: StudioModuleId = 'transform'
  private terrainBrush: TerrainBrushSettings = { ...DEFAULT_TERRAIN_BRUSH }
  private roadTool: RoadToolMode = 'draw'
  private roadKind: RoadKind = DEFAULT_ROAD_KIND
  private roadDraft: RoadDraft | null = null
  private roadSelection: RoadPointSelection | null = null
  private parcelTool: ParcelToolMode = 'draw'
  private parcelBlock: FieldBlockId = DEFAULT_PARCEL_BLOCK
  private parcelFertility = DEFAULT_PARCEL_FERTILITY
  private parcelDraft: ParcelDraft | null = null
  private vegetationTool: VegetationToolMode = 'place'
  private vegetationType: VegetationTypeId = DEFAULT_VEGETATION_TYPE
  private vegetationRandomRotation = true
  private buildingTool: BuildingToolMode = 'place'
  private buildingType: BuildingTypeId = DEFAULT_BUILDING_TYPE
  private buildingRotationY = 0
  private buildingSnapRotation = true
  private vehicleTool: VehicleToolMode = 'place'
  private vehicleType: VehiclePlacementTypeId = DEFAULT_VEHICLE_TYPE
  private placementEntryId: string = getDefaultStudioPlacementId()
  private vehicleRotationY = 0
  private anchorKind: SceneAnchorKind = 'entry'
  private anchorParentId: string | null = null
  private waterTool: WaterToolMode = 'draw'
  private waterType: WaterTypeId = DEFAULT_WATER_TYPE
  private waterSplineDraft: { points: WaterControlPoint[] } | null = null
  private waterAreaDraft: {
    cornerA: { x: number; z: number }
    cornerB: { x: number; z: number } | null
  } | null = null
  private validationReport: MapValidationReport | null = null
  private validationFocusIssueId: string | null = null
  private gameplayDebugEnabled = true
  private readonly commandHistory = new StudioCommandHistory()
  private cachedSnapshot: StudioSnapshot

  constructor(initialMap: WorldMapDocument) {
    const migrated = migrateLegacyBuildings(initialMap)
    this.map = {
      ...migrated,
      terrain: ensureTerrainHeightfield(migrated.terrain),
    }
    this.layerVisibility = createDefaultLayerVisibility()
    syncFieldParcelIdCounterFromMap(this.map)
    syncVegetationIdCounterFromMap(this.map)
    syncBuildingIdCounterFromMap(this.map)
    syncWaterIdCounterFromMap(this.map)
    syncAnchorIdCounterFromMap(this.map.objects)
    syncVehicleIdCounterFromMap(this.map)
    this.cachedSnapshot = this.createSnapshot()
    if (mapHasLegacyBuildings(initialMap)) {
      this.log('info', 'Legacy hub buildings migrated to Building Editor types.')
    }
    this.log('info', `Map loaded: ${migrated.name}`)
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot(): StudioSnapshot {
    return this.cachedSnapshot
  }

  getMap(): WorldMapDocument {
    return this.map
  }

  findObject(objectId: string): MapObject | null {
    return this.map.objects.find((object) => object.id === objectId) ?? null
  }

  updateObject(
    objectId: string,
    patch: {
      name?: string
      transform?: {
        position?: Partial<MapVec3>
        rotationY?: number
        scale?: Partial<MapVec3>
      }
      shape?: Partial<MapBoxShape>
    },
  ): boolean {
    const index = this.map.objects.findIndex((object) => object.id === objectId)
    if (index < 0) {
      return false
    }

    const current = this.map.objects[index]
    const nextTransform = { ...current.transform }
    if (patch.transform?.position) {
      nextTransform.position = {
        ...nextTransform.position,
        ...patch.transform.position,
      }
    }
    if (patch.transform?.rotationY !== undefined) {
      nextTransform.rotationY = patch.transform.rotationY
    }
    if (patch.transform?.scale) {
      nextTransform.scale = {
        ...(nextTransform.scale ?? { x: 1, y: 1, z: 1 }),
        ...patch.transform.scale,
      }
    }

    let nextShape = current.shape
    if (patch.shape && current.shape?.type === 'box') {
      nextShape = { ...current.shape, ...patch.shape }
    }

    const nextObject: MapObject = {
      ...current,
      name: patch.name !== undefined ? patch.name : current.name,
      transform: nextTransform,
      shape: nextShape,
    }

    const objects = [...this.map.objects]
    objects[index] = nextObject
    this.map = { ...this.map, objects }
    this.dirty = true

    if (this.selectedObject?.id === objectId) {
      this.selectedObject = nextObject
    }

    this.emit()
    return true
  }

  deleteObject(objectId: string): boolean {
    if (objectId === 'terrain_ground') {
      this.log('warn', 'Ground terrain cannot be deleted.')
      return false
    }

    const object = this.findObject(objectId)
    if (!object) {
      return false
    }

    this.map = {
      ...this.map,
      objects: this.map.objects.filter((entry) => entry.id !== objectId),
    }
    this.dirty = true

    if (this.selectedObject?.id === objectId) {
      this.selectedObject = null
    }

    this.log('info', `Deleted: ${object.name ?? objectId}`)
    this.emit()
    return true
  }

  setMap(map: WorldMapDocument, options?: { markDirty?: boolean }): void {
    const hadLegacy = mapHasLegacyBuildings(map)
    const migrated = migrateLegacyBuildings(map)
    this.map = {
      ...migrated,
      terrain: ensureTerrainHeightfield(migrated.terrain),
    }
    syncFieldParcelIdCounterFromMap(this.map)
    syncVegetationIdCounterFromMap(this.map)
    syncBuildingIdCounterFromMap(this.map)
    syncWaterIdCounterFromMap(this.map)
    syncAnchorIdCounterFromMap(this.map.objects)
    syncVehicleIdCounterFromMap(this.map)
    this.selectedObject = null
    this.commandHistory.clear()
    if (options?.markDirty !== false) {
      this.dirty = true
    }
    if (hadLegacy) {
      this.log('info', 'Legacy hub buildings migrated to Building Editor types.')
    }
    this.emit()
  }

  updateMapMetadata(patch: {
    name?: string
    id?: string
    description?: string
    author?: string
  }): void {
    const nextName = patch.name?.trim()
    const nextId = patch.id?.trim()
    const nextDescription = patch.description?.trim()
    const nextAuthor = patch.author?.trim()

    if (
      nextName === undefined &&
      nextId === undefined &&
      nextDescription === undefined &&
      nextAuthor === undefined
    ) {
      return
    }

    this.map = {
      ...this.map,
      ...(nextId ? { id: nextId } : {}),
      ...(nextName ? { name: nextName } : {}),
      meta: {
        ...this.map.meta,
        ...(nextDescription !== undefined ? { description: nextDescription } : {}),
        ...(nextAuthor !== undefined ? { author: nextAuthor } : {}),
        updatedAt: new Date().toISOString(),
      },
    }
    this.dirty = true
    this.log('info', 'Map metadata updated.')
    this.emit()
  }

  selectObject(object: MapObject | null): void {
    this.selectedObject = object
    if (object) {
      this.log('info', `Selected: ${object.name ?? object.id} (${object.layer})`)
    }
    this.emit()
  }

  checkpointHistory(label: string): void {
    this.commandHistory.checkpoint(
      this.map,
      this.selectedObject?.id ?? null,
      label,
    )
  }

  canUndo(): boolean {
    return this.commandHistory.canUndo()
  }

  canRedo(): boolean {
    return this.commandHistory.canRedo()
  }

  undo(): boolean {
    const restored = this.commandHistory.undo(
      this.map,
      this.selectedObject?.id ?? null,
    )
    if (!restored) {
      return false
    }
    this.map = restored.map
    this.selectedObject = restored.selectedObjectId
      ? (this.findObject(restored.selectedObjectId) ?? null)
      : null
    this.dirty = true
    this.log('info', `Undo: ${restored.label}`)
    this.emit()
    return true
  }

  redo(): boolean {
    const restored = this.commandHistory.redo(
      this.map,
      this.selectedObject?.id ?? null,
    )
    if (!restored) {
      return false
    }
    this.map = restored.map
    this.selectedObject = restored.selectedObjectId
      ? (this.findObject(restored.selectedObjectId) ?? null)
      : null
    this.dirty = true
    this.log('info', `Redo: ${restored.label}`)
    this.emit()
    return true
  }

  previewMoveObjectWithAnchors(
    objectId: string,
    position: { x: number; z: number },
  ): MapObject[] {
    const object = this.findObject(objectId)
    if (!object) {
      return []
    }
    if (isSceneAnchorObject(object)) {
      return [
        {
          ...object,
          transform: {
            ...object.transform,
            position: {
              ...object.transform.position,
              x: position.x,
              z: position.z,
            },
          },
        },
      ]
    }
    const deltaX = position.x - object.transform.position.x
    const deltaZ = position.z - object.transform.position.z
    const nextObjects = translateObjectsWithAnchors(
      this.map.objects,
      objectId,
      deltaX,
      deltaZ,
    )
    return nextObjects.filter(
      (entry) =>
        entry.id === objectId ||
        (isSceneAnchorObject(entry) && entry.properties?.parentObjectId === objectId),
    )
  }

  moveObjectWithAnchors(
    objectId: string,
    position: { x: number; z: number },
  ): boolean {
    const object = this.findObject(objectId)
    if (!object) {
      return false
    }
    const deltaX = position.x - object.transform.position.x
    const deltaZ = position.z - object.transform.position.z
    if (isSceneAnchorObject(object)) {
      return this.updateAnchor(objectId, { position })
    }
    if (!isGameplayParentObject(object)) {
      return this.updateObject(objectId, {
        transform: { position: { x: position.x, z: position.z } },
      })
    }
    const objects = translateObjectsWithAnchors(
      this.map.objects,
      objectId,
      deltaX,
      deltaZ,
    )
    this.map = { ...this.map, objects }
    this.dirty = true
    if (this.selectedObject?.id === objectId) {
      this.selectedObject = this.findObject(objectId)
    }
    this.emit()
    return true
  }

  previewRotateObjectWithAnchors(
    objectId: string,
    rotationY: number,
  ): MapObject[] {
    const object = this.findObject(objectId)
    if (!object || isSceneAnchorObject(object)) {
      return object ? [{ ...object, transform: { ...object.transform, rotationY } }] : []
    }
    const nextObjects = rotateObjectsWithAnchors(
      this.map.objects,
      objectId,
      rotationY,
    )
    return nextObjects.filter(
      (entry) =>
        entry.id === objectId ||
        (isSceneAnchorObject(entry) && entry.properties?.parentObjectId === objectId),
    )
  }

  rotateObjectWithAnchors(objectId: string, rotationY: number): boolean {
    const object = this.findObject(objectId)
    if (!object) {
      return false
    }
    if (isSceneAnchorObject(object)) {
      return this.updateAnchor(objectId, { rotationY })
    }
    if (!isGameplayParentObject(object)) {
      return this.updateObject(objectId, { transform: { rotationY } })
    }
    const objects = rotateObjectsWithAnchors(this.map.objects, objectId, rotationY)
    this.map = { ...this.map, objects }
    this.dirty = true
    if (this.selectedObject?.id === objectId) {
      this.selectedObject = this.findObject(objectId)
    }
    this.emit()
    return true
  }

  duplicateObject(objectId: string): MapObject | null {
    this.checkpointHistory('duplicate')
    const duplicated = duplicateMapObject(this.map, objectId)
    if (!duplicated) {
      return null
    }
    this.map = {
      ...this.map,
      objects: [...this.map.objects, ...duplicated.objects],
    }
    this.dirty = true
    this.selectedObject = duplicated.root
    this.log('success', `Duplicated ${objectId} → ${duplicated.root.id}`)
    this.emit()
    return duplicated.root
  }

  deleteGameplayObject(objectId: string): boolean {
    const object = this.findObject(objectId)
    if (!object || object.id === 'terrain_ground') {
      return false
    }
    if (object.layer === 'buildings') {
      return this.deleteBuilding(objectId)
    }
    if (object.layer === 'vehicles') {
      return this.deleteVehicle(objectId)
    }
    if (isSceneAnchorObject(object)) {
      return this.deleteAnchor(objectId)
    }
    this.checkpointHistory('delete')
    return this.deleteObject(objectId)
  }

  setLayerVisible(layer: StudioLayerId, visible: boolean): void {
    this.layerVisibility[layer] = visible
    this.emit()
  }

  setGameplayDebugEnabled(enabled: boolean): void {
    this.gameplayDebugEnabled = enabled
    this.emit()
  }

  toggleGameplayDebug(): void {
    this.setGameplayDebugEnabled(!this.gameplayDebugEnabled)
  }

  setActiveModule(moduleId: StudioModuleId): void {
    if (this.activeModuleId === moduleId) {
      return
    }
    if (moduleId !== 'water') {
      this.clearWaterDrafts()
    }
    this.activeModuleId = moduleId
    if (moduleId === 'terrain') {
      this.selectedObject = null
      this.roadDraft = null
      this.roadSelection = null
      this.parcelDraft = null
      if (this.terrainBrush.mode !== 'paint') {
        this.terrainBrush = { ...this.terrainBrush, mode: 'paint' }
      }
    }
    if (moduleId === 'roads') {
      this.selectedObject = null
      this.roadDraft = null
      this.roadSelection = null
      this.parcelDraft = null
    }
    if (moduleId === 'parcels') {
      this.selectedObject = null
      this.roadDraft = null
      this.roadSelection = null
      this.parcelDraft = null
    }
    if (moduleId === 'vegetation') {
      this.selectedObject = null
      this.roadDraft = null
      this.roadSelection = null
      this.parcelDraft = null
    }
    if (moduleId === 'buildings') {
      this.selectedObject = null
      this.roadDraft = null
      this.roadSelection = null
      this.parcelDraft = null
      this.clearWaterDrafts()
    }
    if (moduleId === 'water') {
      this.selectedObject = null
      this.roadDraft = null
      this.roadSelection = null
      this.parcelDraft = null
      this.clearWaterDrafts()
    }
    if (moduleId === 'validation') {
      this.selectedObject = null
      this.roadDraft = null
      this.roadSelection = null
      this.parcelDraft = null
      this.clearWaterDrafts()
      this.validationFocusIssueId = null
      this.runMapValidation()
    }
    if (moduleId === 'export') {
      this.selectedObject = null
      this.roadDraft = null
      this.roadSelection = null
      this.parcelDraft = null
      this.clearWaterDrafts()
      this.validationFocusIssueId = null
      if (!this.validationReport) {
        this.runMapValidation()
      }
    }
    if (moduleId !== 'validation') {
      this.validationFocusIssueId = null
    }
    this.log('info', `Module: ${moduleId}`)
    this.emit()
  }

  setTerrainBrush(patch: Partial<TerrainBrushSettings>): void {
    this.terrainBrush = { ...this.terrainBrush, ...patch }
    this.emit()
  }

  setTerrainField(field: TerrainHeightfield): void {
    this.map = {
      ...this.map,
      terrain: mergeTerrainIntoDocument(this.map.terrain, field),
    }
    this.dirty = true
    this.emit()
  }

  setRoadTool(tool: RoadToolMode): void {
    this.roadTool = tool
    this.roadSelection = null
    this.emit()
  }

  setRoadKind(kind: RoadKind): void {
    this.roadKind = kind
    if (this.roadDraft) {
      this.roadDraft = { ...this.roadDraft, roadKind: kind }
    }
    this.emit()
  }

  startRoadDraft(): void {
    this.roadDraft = { roadKind: this.roadKind, points: [] }
    this.roadSelection = null
    this.emit()
  }

  cancelRoadDraft(): void {
    this.roadDraft = null
    this.emit()
  }

  addRoadDraftPoint(point: RoadControlPoint): void {
    if (!this.roadDraft) {
      this.roadDraft = { roadKind: this.roadKind, points: [] }
    }
    this.roadDraft = {
      ...this.roadDraft,
      points: [...this.roadDraft.points, point],
    }
    this.emit()
  }

  updateRoadDraftPoints(points: RoadControlPoint[]): void {
    if (!this.roadDraft) {
      return
    }
    this.roadDraft = { ...this.roadDraft, points }
    this.emit()
  }

  commitRoadDraft(): boolean {
    if (!this.roadDraft || this.roadDraft.points.length < 2) {
      this.log('warn', 'Road needs at least 2 points.')
      return false
    }

    const extended = tryMergeDraftExtensionIntoAnchor(this.map, this.roadDraft)
    if (extended) {
      this.map = extended.map
      this.roadDraft = null
      this.dirty = true
      this.log('success', `Extended ${extended.roadName}`)
      this.emit()
      return true
    }

    const road = createRoadObject(this.roadDraft.points, this.roadDraft.roadKind)
    this.map = applyJunctionsToAnchorRoads(
      {
        ...this.map,
        objects: [...this.map.objects, road],
      },
      road.id,
      this.roadDraft.roadKind,
      this.roadDraft.points,
    )
    this.roadDraft = null
    this.dirty = true
    this.log('success', `Created ${road.name}`)
    this.emit()
    return true
  }

  selectRoadPoint(roadId: string, pointIndex: number): void {
    this.roadSelection = { roadId, pointIndex }
    this.emit()
  }

  clearRoadSelection(): void {
    if (!this.roadSelection) {
      return
    }
    this.roadSelection = null
    this.emit()
  }

  updateRoadPoints(roadId: string, points: RoadControlPoint[]): void {
    const index = this.map.objects.findIndex((object) => object.id === roadId)
    if (index < 0) {
      return
    }
    const current = this.map.objects[index]
    const roadKind = getRoadKind(current)
    const objects = [...this.map.objects]
    objects[index] = {
      ...current,
      properties: {
        ...current.properties,
        points: points.map((point) => ({
          ...point,
          ...(point.junction ? { junction: { ...point.junction } } : {}),
        })),
      },
    }
    let map = { ...this.map, objects }
    if (roadKind) {
      map = applyJunctionsToAnchorRoads(map, roadId, roadKind, points)
    }
    this.map = map
    this.dirty = true
    this.emit()
  }

  deleteRoad(roadId: string): boolean {
    const road = this.findObject(roadId)
    if (!road || road.layer !== 'roads') {
      return false
    }
    this.map = {
      ...this.map,
      objects: this.map.objects.filter((object) => object.id !== roadId),
    }
    if (this.roadSelection?.roadId === roadId) {
      this.roadSelection = null
    }
    this.dirty = true
    this.log('info', `Deleted ${road.name ?? roadId}`)
    this.emit()
    return true
  }

  setParcelTool(tool: ParcelToolMode): void {
    this.parcelTool = tool
    this.parcelDraft = null
    this.emit()
  }

  setParcelBlock(block: FieldBlockId): void {
    this.parcelBlock = block
    this.emit()
  }

  setParcelFertility(fertility: number): void {
    this.parcelFertility = Math.max(0, Math.min(100, fertility))
    this.emit()
  }

  startParcelDraft(x: number, z: number): void {
    this.parcelDraft = {
      cornerA: { x, z },
      cornerB: null,
    }
    this.emit()
  }

  updateParcelDraftCornerB(x: number, z: number): void {
    if (!this.parcelDraft) {
      return
    }
    this.parcelDraft = {
      ...this.parcelDraft,
      cornerB: { x, z },
    }
    this.emit()
  }

  cancelParcelDraft(): void {
    this.parcelDraft = null
    this.emit()
  }

  commitParcelDraft(): boolean {
    if (!this.parcelDraft?.cornerB) {
      return false
    }

    const { cornerA, cornerB } = this.parcelDraft
    const rect = parcelRectFromCorners(
      cornerA.x,
      cornerA.z,
      cornerB.x,
      cornerB.z,
    )
    const footprint = footprintFromRect(rect)
    const validation = validateParcelFootprint(this.map, footprint)
    if (!validation.ok) {
      this.log('warn', validation.message ?? 'Invalid parcel.')
      return false
    }

    const surfaceY = sampleFieldSurfaceY(this.map, rect.centerX, rect.centerZ)
    const field = createFieldParcelFromCorners(
      cornerA.x,
      cornerA.z,
      cornerB.x,
      cornerB.z,
      surfaceY,
      {
        parcelBlock: this.parcelBlock,
        fertility: this.parcelFertility,
      },
    )

    this.map = {
      ...this.map,
      objects: [...this.map.objects, field],
    }
    this.parcelDraft = null
    this.dirty = true
    this.log('success', `Created ${field.name} (${field.id})`)
    this.emit()
    return true
  }

  updateFieldParcel(
    fieldId: string,
    patch: {
      name?: string
      parcelBlock?: FieldBlockId
      fertility?: number
      fieldTestState?: import('@/types/field-test-state.ts').FieldTestState
    },
  ): boolean {
    const index = this.map.objects.findIndex((object) => object.id === fieldId)
    if (index < 0) {
      return false
    }
    const current = this.map.objects[index]
    if (current.layer !== 'fields' || current.kind !== 'field') {
      return false
    }

    const properties = patchFieldParcelProperties(
      { ...current.properties },
      {
        ...(patch.parcelBlock !== undefined
          ? { parcelBlock: patch.parcelBlock }
          : {}),
        ...(patch.fertility !== undefined ? { fertility: patch.fertility } : {}),
        ...(patch.fieldTestState !== undefined
          ? { fieldTestState: patch.fieldTestState }
          : {}),
      },
    )

    const nextObject: MapObject = {
      ...current,
      name: patch.name !== undefined ? patch.name : current.name,
      properties,
    }

    const objects = [...this.map.objects]
    objects[index] = nextObject
    this.map = { ...this.map, objects }
    this.dirty = true

    if (this.selectedObject?.id === fieldId) {
      this.selectedObject = nextObject
    }

    this.emit()
    return true
  }

  deleteField(fieldId: string): boolean {
    const field = this.findObject(fieldId)
    if (!field || field.layer !== 'fields') {
      return false
    }
    this.map = {
      ...this.map,
      objects: this.map.objects.filter((object) => object.id !== fieldId),
    }
    if (this.selectedObject?.id === fieldId) {
      this.selectedObject = null
    }
    this.dirty = true
    this.log('info', `Deleted ${field.name ?? fieldId}`)
    this.emit()
    return true
  }

  setVegetationTool(tool: VegetationToolMode): void {
    this.vegetationTool = tool
    this.emit()
  }

  setVegetationType(typeId: VegetationTypeId): void {
    this.vegetationType = typeId
    this.emit()
  }

  setVegetationRandomRotation(enabled: boolean): void {
    this.vegetationRandomRotation = enabled
    this.emit()
  }

  placeVegetation(
    worldX: number,
    worldZ: number,
    options?: { silent?: boolean },
  ): MapObject | null {
    const surfaceY = sampleVegetationGroundY(this.map, worldX, worldZ)
    const rotationY = this.vegetationRandomRotation
      ? Math.random() * Math.PI * 2
      : 0
    const vegetation = createVegetationObject(worldX, worldZ, {
      vegetationType: this.vegetationType,
      surfaceY,
      rotationY,
    })
    this.map = {
      ...this.map,
      objects: [...this.map.objects, vegetation],
    }
    this.dirty = true
    if (!options?.silent) {
      this.log('success', `Placed ${vegetation.name} (${vegetation.id})`)
    }
    this.emit()
    return vegetation
  }

  updateVegetation(
    vegetationId: string,
    patch: {
      name?: string
      rotationY?: number
      vegetationType?: VegetationTypeId
    },
  ): boolean {
    const index = this.map.objects.findIndex((object) => object.id === vegetationId)
    if (index < 0) {
      return false
    }
    const current = this.map.objects[index]
    if (current.layer !== 'vegetation') {
      return false
    }

    let next = { ...current }
    if (patch.name !== undefined) {
      next = { ...next, name: patch.name }
    }
    if (patch.rotationY !== undefined) {
      next = {
        ...next,
        transform: {
          ...next.transform,
          rotationY: patch.rotationY,
        },
      }
    }
    if (patch.vegetationType !== undefined) {
      const definition = getVegetationTypeDefinition(patch.vegetationType)
      next = {
        ...next,
        kind: definition.kind,
        name: patch.name ?? definition.label,
        properties: {
          vegetationType: definition.id,
          heightClass: definition.heightClass,
          spreadClass: definition.spreadClass,
        },
      }
    }

    const objects = [...this.map.objects]
    objects[index] = next
    this.map = { ...this.map, objects }
    this.dirty = true

    if (this.selectedObject?.id === vegetationId) {
      this.selectedObject = next
    }

    this.emit()
    return true
  }

  deleteVegetation(vegetationId: string): boolean {
    const vegetation = this.findObject(vegetationId)
    if (!vegetation || vegetation.layer !== 'vegetation') {
      return false
    }
    this.map = {
      ...this.map,
      objects: this.map.objects.filter((object) => object.id !== vegetationId),
    }
    if (this.selectedObject?.id === vegetationId) {
      this.selectedObject = null
    }
    this.dirty = true
    this.log('info', `Deleted ${vegetation.name ?? vegetationId}`)
    this.emit()
    return true
  }

  setBuildingTool(tool: BuildingToolMode): void {
    this.buildingTool = tool
    this.emit()
  }

  setBuildingType(typeId: BuildingTypeId): void {
    this.buildingType = typeId
    this.emit()
  }

  setBuildingRotationY(rotationY: number): void {
    this.buildingRotationY = rotationY
    this.emit()
  }

  setBuildingSnapRotation(enabled: boolean): void {
    this.buildingSnapRotation = enabled
    this.emit()
  }

  private resolveBuildingPlacementRotation(): number {
    if (!this.buildingSnapRotation) {
      return this.buildingRotationY
    }
    const step = Math.PI / 2
    return Math.round(this.buildingRotationY / step) * step
  }

  placeBuilding(worldX: number, worldZ: number): MapObject | null {
    this.checkpointHistory('place')
    const surfaceY = sampleBuildingGroundY(this.map, worldX, worldZ)
    const building = createBuildingObject(worldX, worldZ, {
      buildingType: this.buildingType,
      surfaceY,
      rotationY: this.resolveBuildingPlacementRotation(),
    })
    const anchors = createDefaultBuildingAnchors(
      building,
      this.buildingType,
      surfaceY,
    )
    const anchorIds = anchors.map((anchor) => anchor.id)
    const buildingWithAnchors: MapObject = {
      ...building,
      properties: {
        ...building.properties,
        anchorIds,
      },
    }
    this.map = {
      ...this.map,
      objects: [...this.map.objects, buildingWithAnchors, ...anchors],
    }
    this.dirty = true
    this.log(
      'success',
      `Placed ${building.name} (${building.id}) with ${anchors.length} anchors`,
    )
    this.emit()
    return buildingWithAnchors
  }

  updateBuilding(
    buildingId: string,
    patch: {
      name?: string
      rotationY?: number
      buildingType?: BuildingTypeId
      owner?: string
      active?: boolean
    },
  ): boolean {
    const index = this.map.objects.findIndex((object) => object.id === buildingId)
    if (index < 0) {
      return false
    }
    const current = this.map.objects[index]
    if (current.layer !== 'buildings') {
      return false
    }

    let next = { ...current }
    if (patch.name !== undefined) {
      next = { ...next, name: patch.name }
    }
    if (patch.rotationY !== undefined) {
      next = {
        ...next,
        transform: {
          ...next.transform,
          rotationY: patch.rotationY,
        },
      }
    }
    if (patch.buildingType !== undefined) {
      const definition = getBuildingTypeDefinition(patch.buildingType)
      const totalHeight = getBuildingTotalHeight(definition)
      next = {
        ...next,
        kind: definition.id,
        name: patch.name ?? definition.label,
        shape: {
          type: 'box',
          width: definition.width,
          height: totalHeight,
          depth: definition.depth,
        },
        properties: {
          buildingType: definition.id,
          category: definition.category,
          owner:
            typeof current.properties?.owner === 'string'
              ? current.properties.owner
              : 'farm',
          active: current.properties?.active !== false,
          anchorIds: Array.isArray(current.properties?.anchorIds)
            ? current.properties.anchorIds
            : [],
        },
      }
    }
    if (patch.owner !== undefined) {
      next = {
        ...next,
        properties: { ...next.properties, owner: patch.owner },
      }
    }
    if (patch.active !== undefined) {
      next = {
        ...next,
        properties: { ...next.properties, active: patch.active },
      }
    }

    const objects = [...this.map.objects]
    objects[index] = next
    this.map = { ...this.map, objects }
    this.dirty = true

    if (this.selectedObject?.id === buildingId) {
      this.selectedObject = next
    }

    this.emit()
    return true
  }

  deleteBuilding(buildingId: string): boolean {
    if (buildingId === 'terrain_ground') {
      return false
    }
    const building = this.findObject(buildingId)
    if (!building || building.layer !== 'buildings') {
      return false
    }
    this.checkpointHistory('delete')
    const anchorIds = new Set(
      getAnchorsForParent(this.map.objects, buildingId).map((anchor) => anchor.id),
    )
    this.map = {
      ...this.map,
      objects: this.map.objects.filter(
        (object) => object.id !== buildingId && !anchorIds.has(object.id),
      ),
    }
    if (this.selectedObject?.id === buildingId) {
      this.selectedObject = null
    }
    this.dirty = true
    this.log('info', `Deleted ${building.name ?? buildingId}`)
    this.emit()
    return true
  }

  setVehicleTool(tool: VehicleToolMode): void {
    this.vehicleTool = tool
    this.emit()
  }

  setPlacementEntryId(placementId: string): void {
    const entry = getStudioPlacementEntry(placementId)
    if (!entry) {
      return
    }
    this.placementEntryId = placementId
    this.vehicleType = entry.catalogKind === 'machine'
      ? entry.catalogId.includes('combine')
        ? entry.catalogId.includes('corn')
          ? 'corn_combine'
          : 'grain_combine'
        : 'tractor'
      : entry.category === 'trailer'
        ? 'trailer'
        : 'implement'
    this.emit()
  }

  setVehicleType(typeId: VehiclePlacementTypeId): void {
    this.vehicleType = typeId
    this.emit()
  }

  setVehicleRotationY(rotationY: number): void {
    this.vehicleRotationY = rotationY
    this.emit()
  }

  setAnchorKind(kind: SceneAnchorKind): void {
    this.anchorKind = kind
    this.emit()
  }

  setAnchorParentId(parentId: string | null): void {
    this.anchorParentId = parentId
    this.emit()
  }

  listAnchorsForParent(parentId: string): MapObject[] {
    return getAnchorsForParent(this.map.objects, parentId)
  }

  placeVehicle(worldX: number, worldZ: number): MapObject | null {
    this.checkpointHistory('place')
    const surfaceY = sampleBuildingGroundY(this.map, worldX, worldZ)
    const entry = getStudioPlacementEntry(this.placementEntryId)
    const machineId = entry
      ? allocateMapMachineInstanceId(this.map, entry)
      : undefined
    const attachmentInstanceId =
      entry?.catalogKind === 'attachment' && entry.attachmentCatalogId
        ? allocateMapAttachmentInstanceId(this.map, entry.attachmentCatalogId)
        : undefined

    const vehicle = createVehiclePlacementObject(worldX, worldZ, {
      vehicleType: this.vehicleType,
      placementEntry: entry,
      surfaceY,
      rotationY: this.vehicleRotationY,
      machineId,
      attachmentInstanceId,
    })
    const anchors =
      entry
        ? createDefaultPlacementAnchors(vehicle, entry, surfaceY, machineId)
        : []
    const parkingAnchor = anchors.find(
      (anchor) => anchor.properties?.anchorKind === 'parking',
    )
    const vehicleWithMeta: MapObject = {
      ...vehicle,
      properties: {
        ...vehicle.properties,
        ...(parkingAnchor ? { parkingAnchorId: parkingAnchor.id } : {}),
      },
    }
    this.map = {
      ...this.map,
      objects: [...this.map.objects, vehicleWithMeta, ...anchors],
    }
    this.dirty = true
    this.log('success', `Placed ${vehicle.name} (${vehicle.id}) with anchors`)
    this.emit()
    return vehicleWithMeta
  }

  updateVehicle(
    vehicleId: string,
    patch: {
      name?: string
      rotationY?: number
      vehicleType?: VehiclePlacementTypeId
      active?: boolean
      hostBuildingId?: string | null
    },
  ): boolean {
    const index = this.map.objects.findIndex((object) => object.id === vehicleId)
    if (index < 0) {
      return false
    }
    const current = this.map.objects[index]
    if (current.layer !== 'vehicles') {
      return false
    }
    let next: MapObject = { ...current }
    if (patch.name !== undefined) {
      next = { ...next, name: patch.name }
    }
    if (patch.rotationY !== undefined) {
      next = {
        ...next,
        transform: { ...next.transform, rotationY: patch.rotationY },
      }
    }
    if (patch.vehicleType !== undefined) {
      const definition = getVehicleTypeDefinition(patch.vehicleType)
      next = {
        ...next,
        kind: definition.id,
        shape: {
          type: 'box',
          width: definition.width,
          height: definition.height,
          depth: definition.depth,
        },
        properties: {
          ...next.properties,
          vehicleType: definition.id,
          ...(definition.defaultMachineId
            ? { machineId: definition.defaultMachineId }
            : {}),
        },
      }
    }
    if (patch.active !== undefined) {
      next = {
        ...next,
        properties: { ...next.properties, active: patch.active },
      }
    }
    if (patch.hostBuildingId !== undefined) {
      const props = { ...next.properties }
      if (patch.hostBuildingId) {
        props.hostBuildingId = patch.hostBuildingId
      } else {
        delete props.hostBuildingId
      }
      next = { ...next, properties: props }
    }
    const objects = [...this.map.objects]
    objects[index] = next
    this.map = { ...this.map, objects }
    this.dirty = true
    if (this.selectedObject?.id === vehicleId) {
      this.selectedObject = next
    }
    this.emit()
    return true
  }

  deleteVehicle(vehicleId: string): boolean {
    const vehicle = this.findObject(vehicleId)
    if (!vehicle || vehicle.layer !== 'vehicles') {
      return false
    }
    this.checkpointHistory('delete')
    const anchorIds = new Set(
      getAnchorsForParent(this.map.objects, vehicleId).map((anchor) => anchor.id),
    )
    this.map = {
      ...this.map,
      objects: this.map.objects.filter(
        (object) => object.id !== vehicleId && !anchorIds.has(object.id),
      ),
    }
    if (this.selectedObject?.id === vehicleId) {
      this.selectedObject = null
    }
    this.dirty = true
    this.log('info', `Deleted ${vehicle.name ?? vehicleId}`)
    this.emit()
    return true
  }

  placeAnchor(
    worldX: number,
    worldZ: number,
    parentObjectId?: string,
  ): MapObject | null {
    this.checkpointHistory('place')
    const surfaceY = sampleBuildingGroundY(this.map, worldX, worldZ)
    const parentId = parentObjectId ?? this.anchorParentId ?? undefined
    const anchor = createSceneAnchorObject(worldX, worldZ, {
      anchorKind: this.anchorKind,
      label: `${this.anchorKind} point`,
      surfaceY,
      parentObjectId: parentId,
    })
    const objects = [...this.map.objects, anchor]
    if (parentId) {
      const parentIndex = objects.findIndex((o) => o.id === parentId)
      if (parentIndex >= 0 && objects[parentIndex].layer === 'buildings') {
        const parent = objects[parentIndex]
        const anchorIds = [
          ...((parent.properties?.anchorIds as string[] | undefined) ?? []),
          anchor.id,
        ]
        objects[parentIndex] = {
          ...parent,
          properties: { ...parent.properties, anchorIds },
        }
      }
    }
    this.map = { ...this.map, objects }
    this.dirty = true
    this.log('success', `Placed anchor ${anchor.id}`)
    this.emit()
    return anchor
  }

  updateAnchor(
    anchorId: string,
    patch: {
      label?: string
      position?: { x: number; z: number }
      rotationY?: number
      anchorKind?: SceneAnchorKind
      entityId?: string
      active?: boolean
    },
  ): boolean {
    const index = this.map.objects.findIndex((object) => object.id === anchorId)
    if (index < 0) {
      return false
    }
    const current = this.map.objects[index]
    if (current.layer !== 'poi' || current.kind !== 'anchor') {
      return false
    }
    let next: MapObject = { ...current }
    if (patch.label !== undefined) {
      next = { ...next, name: patch.label, properties: { ...next.properties, label: patch.label } }
    }
    if (patch.anchorKind !== undefined) {
      next = {
        ...next,
        properties: { ...next.properties, anchorKind: patch.anchorKind },
      }
    }
    if (patch.entityId !== undefined) {
      next = {
        ...next,
        properties: { ...next.properties, entityId: patch.entityId },
      }
    }
    if (patch.active !== undefined) {
      next = {
        ...next,
        properties: { ...next.properties, active: patch.active },
      }
    }
    if (patch.position) {
      const y = sampleBuildingGroundY(this.map, patch.position.x, patch.position.z)
      next = {
        ...next,
        transform: {
          ...next.transform,
          position: { x: patch.position.x, y, z: patch.position.z },
          ...(patch.rotationY !== undefined ? { rotationY: patch.rotationY } : {}),
        },
      }
    } else if (patch.rotationY !== undefined) {
      next = {
        ...next,
        transform: { ...next.transform, rotationY: patch.rotationY },
      }
    }
    const objects = [...this.map.objects]
    objects[index] = next
    this.map = { ...this.map, objects }
    this.dirty = true
    if (this.selectedObject?.id === anchorId) {
      this.selectedObject = next
    }
    this.emit()
    return true
  }

  deleteAnchor(anchorId: string): boolean {
    const anchor = this.findObject(anchorId)
    if (!anchor || anchor.layer !== 'poi' || anchor.kind !== 'anchor') {
      return false
    }
    this.checkpointHistory('delete')
    this.map = {
      ...this.map,
      objects: this.map.objects.filter((object) => object.id !== anchorId),
    }
    if (this.selectedObject?.id === anchorId) {
      this.selectedObject = null
    }
    this.dirty = true
    this.emit()
    return true
  }

  private clearWaterDrafts(): void {
    this.waterSplineDraft = null
    this.waterAreaDraft = null
  }

  setWaterTool(tool: WaterToolMode): void {
    this.waterTool = tool
    this.clearWaterDrafts()
    this.emit()
  }

  setWaterType(typeId: WaterTypeId): void {
    const prevSpline = isSplineWaterType(this.waterType)
    const nextSpline = isSplineWaterType(typeId)
    this.waterType = typeId
    if (prevSpline !== nextSpline) {
      this.clearWaterDrafts()
    }
    this.emit()
  }

  addWaterSplineDraftPoint(point: WaterControlPoint): void {
    if (!isSplineWaterType(this.waterType)) {
      return
    }
    if (!this.waterSplineDraft) {
      this.waterSplineDraft = { points: [] }
    }
    this.waterSplineDraft = {
      points: [...this.waterSplineDraft.points, point],
    }
    this.emit()
  }

  cancelWaterSplineDraft(): void {
    this.waterSplineDraft = null
    this.emit()
  }

  commitWaterSplineDraft(): boolean {
    if (!this.waterSplineDraft || this.waterSplineDraft.points.length < 2) {
      this.log('warn', 'Water course needs at least 2 points.')
      return false
    }
    const water = createWaterSplineObject(
      this.waterSplineDraft.points,
      this.waterType,
    )
    this.map = {
      ...this.map,
      objects: [...this.map.objects, water],
    }
    this.waterSplineDraft = null
    this.dirty = true
    this.log('success', `Created ${water.name} (${water.id})`)
    this.emit()
    return true
  }

  startWaterAreaDraft(x: number, z: number): void {
    if (!isAreaWaterType(this.waterType)) {
      return
    }
    this.waterAreaDraft = {
      cornerA: { x, z },
      cornerB: null,
    }
    this.emit()
  }

  updateWaterAreaDraftCornerB(x: number, z: number): void {
    if (!this.waterAreaDraft) {
      return
    }
    this.waterAreaDraft = {
      ...this.waterAreaDraft,
      cornerB: { x, z },
    }
    this.emit()
  }

  cancelWaterAreaDraft(): void {
    this.waterAreaDraft = null
    this.emit()
  }

  commitWaterAreaDraft(): boolean {
    if (!this.waterAreaDraft?.cornerB || !isAreaWaterType(this.waterType)) {
      return false
    }
    const { cornerA, cornerB } = this.waterAreaDraft
    const definition = getWaterTypeDefinition(this.waterType)
    const ellipse = waterEllipseFromCorners(
      cornerA.x,
      cornerA.z,
      cornerB.x,
      cornerB.z,
      definition.minAreaRadius ?? 2,
    )
    const surfaceY = sampleWaterSurfaceY(this.map, ellipse.centerX, ellipse.centerZ)
    const water = createWaterAreaObject(ellipse, surfaceY, this.waterType)
    this.map = {
      ...this.map,
      objects: [...this.map.objects, water],
    }
    this.waterAreaDraft = null
    this.dirty = true
    this.log('success', `Created ${water.name} (${water.id})`)
    this.emit()
    return true
  }

  deleteWater(waterId: string): boolean {
    const water = this.findObject(waterId)
    if (!water || water.layer !== 'water') {
      return false
    }
    this.map = {
      ...this.map,
      objects: this.map.objects.filter((object) => object.id !== waterId),
    }
    if (this.selectedObject?.id === waterId) {
      this.selectedObject = null
    }
    this.dirty = true
    this.log('info', `Deleted ${water.name ?? waterId}`)
    this.emit()
    return true
  }

  runMapValidation(): MapValidationReport {
    const report = validateWorldMap(this.map)
    this.validationReport = report
    this.validationFocusIssueId = null
    if (report.errorCount > 0) {
      this.log(
        'error',
        `Validation failed: ${report.errorCount} errors, ${report.warnCount} warnings, ${report.infoCount} notes.`,
      )
    } else if (report.warnCount > 0) {
      this.log(
        'warn',
        `Validation passed with ${report.warnCount} warnings and ${report.infoCount} notes.`,
      )
    } else if (report.infoCount > 0) {
      this.log(
        'info',
        `Validation passed with ${report.infoCount} notes.`,
      )
    } else {
      this.log('success', 'Validation passed — no issues found.')
    }
    this.emit()
    return report
  }

  focusValidationIssue(issueId: string | null): void {
    if (!issueId) {
      this.validationFocusIssueId = null
      this.selectedObject = null
      this.emit()
      return
    }
    const issue = this.validationReport?.issues.find((entry) => entry.id === issueId)
    if (!issue) {
      return
    }
    this.validationFocusIssueId = issueId
    if (issue.objectId) {
      const object = this.findObject(issue.objectId)
      this.selectedObject = object ?? null
    } else {
      this.selectedObject = null
    }
    this.emit()
  }

  private refreshExportedMapsSnapshot(): MapPackageSummary[] {
    return defaultMapPackageRegistry
      .getSummaries()
      .filter((summary) => defaultMapPackageRegistry.isExportedMap(summary.id))
  }

  exportMapToGame(options?: ExportMapOptions): boolean {
    const report = validateWorldMap(this.map)
    this.validationReport = report
    if (report.errorCount > 0 && !options?.ignoreValidationErrors) {
      this.log(
        'error',
        `Export blocked: ${report.errorCount} validation error(s). Use export anyway if intentional.`,
      )
      this.emit()
      return false
    }

    if (report.errorCount > 0 && options?.ignoreValidationErrors) {
      this.log(
        'warn',
        `Exporting with ${report.errorCount} validation error(s) ignored.`,
      )
    }

    try {
      const packageId =
        options?.packageId?.trim() || suggestStudioPackageId(this.map)
      const stored = exportWorldMapToPackage(this.map, {
        packageId,
        packageName: options?.packageName,
        description: options?.description,
      })
      saveStoredMapPackage(stored)
      registerStoredPackageInRegistry(defaultMapPackageRegistry, stored)
      this.dirty = false
      this.log(
        'success',
        `Exported "${stored.packageData.manifest.name}" as ${packageId} — pick it in New Game.`,
      )
      this.emit()
      return true
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Export failed'
      this.log('error', message)
      this.emit()
      return false
    }
  }

  deleteExportedMap(mapId: string): boolean {
    if (!defaultMapPackageRegistry.isExportedMap(mapId)) {
      this.log('warn', `Map "${mapId}" is not a studio export.`)
      this.emit()
      return false
    }
    if (!deleteStoredMapPackage(mapId)) {
      this.log('warn', `Export "${mapId}" not found in browser storage.`)
      this.emit()
      return false
    }
    defaultMapPackageRegistry.unregisterExported(mapId)
    this.log('info', `Removed exported map "${mapId}" from game list.`)
    this.emit()
    return true
  }

  markSaved(): void {
    this.dirty = false
    this.emit()
  }

  log(
    level: StudioLogEntry['level'],
    message: string,
  ): void {
    this.logs = [
      ...this.logs.slice(-99),
      {
        id: createLogId(),
        level,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]
    this.emit()
  }

  private emit(): void {
    this.cachedSnapshot = this.createSnapshot()
    for (const listener of this.listeners) {
      listener()
    }
  }

  private createSnapshot(): StudioSnapshot {
    return {
      map: this.map,
      selectedObject: this.selectedObject,
      layerVisibility: { ...this.layerVisibility },
      logs: this.logs,
      isDirty: this.dirty,
      activeModuleId: this.activeModuleId,
      terrainBrush: { ...this.terrainBrush },
      roadTool: this.roadTool,
      roadKind: this.roadKind,
      roadDraft: this.roadDraft
        ? { ...this.roadDraft, points: [...this.roadDraft.points] }
        : null,
      roadSelection: this.roadSelection ? { ...this.roadSelection } : null,
      parcelTool: this.parcelTool,
      parcelBlock: this.parcelBlock,
      parcelFertility: this.parcelFertility,
      parcelDraft: this.parcelDraft
        ? {
            cornerA: { ...this.parcelDraft.cornerA },
            cornerB: this.parcelDraft.cornerB
              ? { ...this.parcelDraft.cornerB }
              : null,
          }
        : null,
      vegetationTool: this.vegetationTool,
      vegetationType: this.vegetationType,
      vegetationRandomRotation: this.vegetationRandomRotation,
      buildingTool: this.buildingTool,
      buildingType: this.buildingType,
      buildingRotationY: this.buildingRotationY,
      buildingSnapRotation: this.buildingSnapRotation,
      vehicleTool: this.vehicleTool,
      vehicleType: this.vehicleType,
      placementEntryId: this.placementEntryId,
      vehicleRotationY: this.vehicleRotationY,
      anchorKind: this.anchorKind,
      anchorParentId: this.anchorParentId,
      waterTool: this.waterTool,
      waterType: this.waterType,
      waterSplineDraft: this.waterSplineDraft
        ? { points: [...this.waterSplineDraft.points] }
        : null,
      waterAreaDraft: this.waterAreaDraft
        ? {
            cornerA: { ...this.waterAreaDraft.cornerA },
            cornerB: this.waterAreaDraft.cornerB
              ? { ...this.waterAreaDraft.cornerB }
              : null,
          }
        : null,
      validationReport: this.validationReport
        ? {
            ...this.validationReport,
            issues: [...this.validationReport.issues],
          }
        : null,
      validationFocusIssueId: this.validationFocusIssueId,
      gameplayDebugEnabled: this.gameplayDebugEnabled,
      exportedMaps: this.refreshExportedMapsSnapshot(),
      canUndo: this.commandHistory.canUndo(),
      canRedo: this.commandHistory.canRedo(),
    }
  }
}

export const EMPTY_STUDIO_SNAPSHOT: StudioSnapshot = {
  map: {
    formatVersion: 1,
    id: '',
    name: '',
    meta: { createdAt: '', updatedAt: '' },
    terrain: { width: 0, height: 0 },
    objects: [],
  },
  selectedObject: null,
  layerVisibility: createDefaultLayerVisibility(),
  logs: [],
  isDirty: false,
  activeModuleId: 'transform',
  terrainBrush: { ...DEFAULT_TERRAIN_BRUSH },
  roadTool: 'draw',
  roadKind: DEFAULT_ROAD_KIND,
  roadDraft: null,
  roadSelection: null,
  parcelTool: 'draw',
  parcelBlock: DEFAULT_PARCEL_BLOCK,
  parcelFertility: DEFAULT_PARCEL_FERTILITY,
  parcelDraft: null,
  vegetationTool: 'place',
  vegetationType: DEFAULT_VEGETATION_TYPE,
  vegetationRandomRotation: true,
  buildingTool: 'place',
  buildingType: DEFAULT_BUILDING_TYPE,
  buildingRotationY: 0,
  buildingSnapRotation: true,
  vehicleTool: 'place',
  vehicleType: DEFAULT_VEHICLE_TYPE,
  placementEntryId: getDefaultStudioPlacementId(),
  vehicleRotationY: 0,
  anchorKind: 'entry',
  anchorParentId: null,
  waterTool: 'draw',
  waterType: DEFAULT_WATER_TYPE,
  waterSplineDraft: null,
  waterAreaDraft: null,
  validationReport: null,
  validationFocusIssueId: null,
  gameplayDebugEnabled: true,
  exportedMaps: [],
  canUndo: false,
  canRedo: false,
}
