import type { WorldMapDocument } from '@/types/world-map.ts'

export interface StudioHistoryCheckpoint {
  label: string
  map: WorldMapDocument
  selectedObjectId: string | null
}

function cloneMap(map: WorldMapDocument): WorldMapDocument {
  return JSON.parse(JSON.stringify(map)) as WorldMapDocument
}

export class StudioCommandHistory {
  private readonly undoStack: StudioHistoryCheckpoint[] = []
  private readonly redoStack: StudioHistoryCheckpoint[] = []
  private readonly maxDepth: number

  constructor(maxDepth = 64) {
    this.maxDepth = maxDepth
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  checkpoint(
    map: WorldMapDocument,
    selectedObjectId: string | null,
    label: string,
  ): void {
    this.undoStack.push({
      label,
      map: cloneMap(map),
      selectedObjectId,
    })
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift()
    }
    this.redoStack.length = 0
  }

  undo(
    currentMap: WorldMapDocument,
    currentSelectedId: string | null,
  ): StudioHistoryCheckpoint | null {
    const previous = this.undoStack.pop()
    if (!previous) {
      return null
    }
    this.redoStack.push({
      label: 'redo',
      map: cloneMap(currentMap),
      selectedObjectId: currentSelectedId,
    })
    return previous
  }

  redo(
    currentMap: WorldMapDocument,
    currentSelectedId: string | null,
  ): StudioHistoryCheckpoint | null {
    const next = this.redoStack.pop()
    if (!next) {
      return null
    }
    this.undoStack.push({
      label: 'undo',
      map: cloneMap(currentMap),
      selectedObjectId: currentSelectedId,
    })
    return next
  }

  clear(): void {
    this.undoStack.length = 0
    this.redoStack.length = 0
  }
}
