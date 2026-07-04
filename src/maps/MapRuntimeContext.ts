import type { MapPackageData, MapPackageSummary } from '@/types/map-package.ts'
import type {
  FarmHubLayout,
  FieldLayoutEntry,
  WorldBounds,
} from '@/config/map-01-layout.ts'
import type { FieldCatalogEntry } from '@/config/field-catalog.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'

export interface MapRuntimeContext {
  readonly packageData: MapPackageData
  readonly manifest: MapPackageData['manifest']
  readonly layout: MapPackageData['layout']
  readonly fields: readonly FieldCatalogEntry[]
  readonly fieldLayout: readonly FieldLayoutEntry[]
  readonly farmHub: FarmHubLayout
  readonly worldBounds: WorldBounds
  readonly cameraProfiles: MapPackageData['cameraProfiles']
  /** Full studio document for exported maps — used for in-game rendering. */
  readonly worldMap?: WorldMapDocument
}

let activeMapContext: MapRuntimeContext | null = null

export function setActiveMapContext(context: MapRuntimeContext | null): void {
  activeMapContext = context
}

export function getActiveMapContext(): MapRuntimeContext {
  if (!activeMapContext) {
    throw new Error('No active map package loaded')
  }
  return activeMapContext
}

export function tryGetActiveMapContext(): MapRuntimeContext | null {
  return activeMapContext
}

export function getActiveMapSummary(): MapPackageSummary | null {
  if (!activeMapContext) {
    return null
  }
  const { manifest } = activeMapContext
  return {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    version: manifest.version,
    author: manifest.author,
    preview: manifest.preview,
    source: manifest.source,
    fieldCount: activeMapContext.fields.length,
    blockIds: [...new Set(activeMapContext.fields.map((field) => field.blockId))],
  }
}
