import type {
  MapBoxShape,
  MapObject,
  MapVec3,
  StudioLayerId,
  StudioLogEntry,
  WorldMapDocument,
} from '@/types/world-map.ts'
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
import { syncFieldObjectsFromTerrain } from '@/studio/terrain/TerrainFieldSync.ts'

export type StudioModuleId = 'transform' | 'terrain'

export interface StudioSnapshot {
  map: WorldMapDocument
  selectedObject: MapObject | null
  layerVisibility: Record<StudioLayerId, boolean>
  logs: readonly StudioLogEntry[]
  isDirty: boolean
  activeModuleId: StudioModuleId
  terrainBrush: TerrainBrushSettings
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
  private cachedSnapshot: StudioSnapshot

  constructor(initialMap: WorldMapDocument) {
    const terrain = ensureTerrainHeightfield(initialMap.terrain)
    const mapWithTerrain = { ...initialMap, terrain }
    this.map = {
      ...mapWithTerrain,
      objects: syncFieldObjectsFromTerrain(mapWithTerrain),
    }
    this.layerVisibility = createDefaultLayerVisibility()
    this.cachedSnapshot = this.createSnapshot()
    this.log('info', `Map loaded: ${initialMap.name}`)
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
    const terrain = ensureTerrainHeightfield(map.terrain)
    const mapWithTerrain = { ...map, terrain }
    this.map = {
      ...mapWithTerrain,
      objects: syncFieldObjectsFromTerrain(mapWithTerrain),
    }
    this.selectedObject = null
    if (options?.markDirty !== false) {
      this.dirty = true
    }
    this.emit()
  }

  selectObject(object: MapObject | null): void {
    this.selectedObject = object
    if (object) {
      this.log('info', `Selected: ${object.name ?? object.id} (${object.layer})`)
      return
    }
    this.emit()
  }

  setLayerVisible(layer: StudioLayerId, visible: boolean): void {
    this.layerVisibility[layer] = visible
    this.emit()
  }

  setActiveModule(moduleId: StudioModuleId): void {
    if (this.activeModuleId === moduleId) {
      return
    }
    this.activeModuleId = moduleId
    if (moduleId === 'terrain') {
      this.selectedObject = null
    }
    this.log('info', `Module: ${moduleId}`)
    this.emit()
  }

  setTerrainBrush(patch: Partial<TerrainBrushSettings>): void {
    this.terrainBrush = { ...this.terrainBrush, ...patch }
    this.emit()
  }

  setTerrainField(field: TerrainHeightfield): void {
    const terrain = mergeTerrainIntoDocument(this.map.terrain, field)
    const draftMap = { ...this.map, terrain }
    this.map = {
      ...draftMap,
      objects: syncFieldObjectsFromTerrain(draftMap),
    }
    this.dirty = true
    this.emit()
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
}
