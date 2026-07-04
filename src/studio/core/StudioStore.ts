import type {
  MapObject,
  StudioLayerId,
  StudioLogEntry,
  WorldMapDocument,
} from '@/types/world-map.ts'
import { createDefaultLayerVisibility } from '@/studio/core/LayerRegistry.ts'

export interface StudioSnapshot {
  map: WorldMapDocument
  selectedObject: MapObject | null
  layerVisibility: Record<StudioLayerId, boolean>
  logs: readonly StudioLogEntry[]
  isDirty: boolean
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
  private cachedSnapshot: StudioSnapshot

  constructor(initialMap: WorldMapDocument) {
    this.map = initialMap
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

  setMap(map: WorldMapDocument, options?: { markDirty?: boolean }): void {
    this.map = map
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
}
