import type { MapPackageData, MapPackageSummary } from '@/types/map-package.ts'
import type { StoredMapPackage } from '@/studio/export/WorldMapExporter.ts'
import { exportWorldMapToPackage } from '@/studio/export/WorldMapExporter.ts'
import type { MapPackageRegistry } from '@/maps/MapPackageLoader.ts'
import { notifyExportsChanged } from '@/maps/exportEvents.ts'

const STORAGE_INDEX_KEY = 'farmos_exported_maps_index'
const STORAGE_PACKAGE_PREFIX = 'farmos_exported_map_'
const STORAGE_INDEX_VERSION = 1

interface ExportedMapsIndex {
  version: typeof STORAGE_INDEX_VERSION
  mapIds: string[]
}

function readIndex(): ExportedMapsIndex {
  try {
    const raw = localStorage.getItem(STORAGE_INDEX_KEY)
    if (!raw) {
      return { version: STORAGE_INDEX_VERSION, mapIds: [] }
    }
    const parsed = JSON.parse(raw) as ExportedMapsIndex
    if (parsed.version !== STORAGE_INDEX_VERSION || !Array.isArray(parsed.mapIds)) {
      return { version: STORAGE_INDEX_VERSION, mapIds: [] }
    }
    return parsed
  } catch {
    return { version: STORAGE_INDEX_VERSION, mapIds: [] }
  }
}

function writeIndex(index: ExportedMapsIndex): void {
  localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index))
}

function packageStorageKey(mapId: string): string {
  return `${STORAGE_PACKAGE_PREFIX}${mapId}`
}

function summaryFromPackage(packageData: MapPackageData): MapPackageSummary {
  const { manifest, fields } = packageData
  return {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    version: manifest.version,
    author: manifest.author,
    preview: manifest.preview,
    source: manifest.source,
    fieldCount: fields.length,
    blockIds: [...new Set(fields.map((field) => field.blockId))],
  }
}

export function listStoredMapPackages(): StoredMapPackage[] {
  const index = readIndex()
  const packages: StoredMapPackage[] = []
  for (const mapId of index.mapIds) {
    const stored = loadStoredMapPackage(mapId)
    if (stored) {
      packages.push(stored)
    }
  }
  return packages
}

export function loadStoredMapPackage(mapId: string): StoredMapPackage | null {
  try {
    const raw = localStorage.getItem(packageStorageKey(mapId))
    if (!raw) {
      return null
    }
    const stored = JSON.parse(raw) as StoredMapPackage
    return normalizeStoredPackage(stored)
  } catch {
    return null
  }
}

function normalizeStoredPackage(stored: StoredMapPackage): StoredMapPackage {
  if (stored.packageData.manifest.id !== 'map_01') {
    return stored
  }
  return {
    ...stored,
    packageData: {
      ...stored.packageData,
      manifest: {
        ...stored.packageData.manifest,
        id: 'map_01_studio',
        name: stored.packageData.manifest.name.includes('Studio')
          ? stored.packageData.manifest.name
          : `${stored.packageData.manifest.name} (Studio)`,
        source: 'community',
      },
    },
  }
}

export function saveStoredMapPackage(stored: StoredMapPackage): void {
  const normalized = normalizeStoredPackage(stored)
  const mapId = normalized.packageData.manifest.id
  const index = readIndex()
  const legacyMap01Key = packageStorageKey('map_01')
  if (mapId !== 'map_01' && localStorage.getItem(legacyMap01Key)) {
    const legacyIndex = index.mapIds.indexOf('map_01')
    if (legacyIndex >= 0) {
      index.mapIds.splice(legacyIndex, 1)
    }
    localStorage.removeItem(legacyMap01Key)
  }
  if (!index.mapIds.includes(mapId)) {
    index.mapIds.push(mapId)
  }
  if (mapId === 'map_01_studio') {
    const legacyIndex = index.mapIds.indexOf('map_01')
    if (legacyIndex >= 0) {
      index.mapIds.splice(legacyIndex, 1)
    }
  }
  writeIndex(index)
  localStorage.setItem(packageStorageKey(mapId), JSON.stringify(normalized))
  notifyExportsChanged()
}

export function deleteStoredMapPackage(mapId: string): boolean {
  const index = readIndex()
  const nextIds = index.mapIds.filter((id) => id !== mapId)
  if (nextIds.length === index.mapIds.length) {
    return false
  }
  writeIndex({ version: STORAGE_INDEX_VERSION, mapIds: nextIds })
  localStorage.removeItem(packageStorageKey(mapId))
  notifyExportsChanged()
  return true
}

export function findStoredMapPackage(mapId: string): StoredMapPackage | null {
  const direct = loadStoredMapPackage(mapId)
  if (direct) {
    return direct
  }

  for (const entry of listStoredMapPackages()) {
    if (entry.packageData.manifest.id === mapId) {
      return entry
    }
  }

  return null
}

export function ensurePackageData(stored: StoredMapPackage): MapPackageData {
  const normalized = normalizeStoredPackage(stored)
  const layout = normalized.packageData.layout
  if (
    layout?.fieldLayout?.length &&
    layout.farmHub?.barn &&
    layout.worldBounds
  ) {
    return normalized.packageData
  }

  if (!normalized.worldMap) {
    return normalized.packageData
  }

  try {
    const rebuilt = exportWorldMapToPackage(normalized.worldMap, {
      packageId: normalized.packageData.manifest.id,
      packageName: normalized.packageData.manifest.name,
      description: normalized.packageData.manifest.description,
    })
    return rebuilt.packageData
  } catch {
    return normalized.packageData
  }
}

export function loadExportedMapsIntoRegistry(registry: MapPackageRegistry): number {
  let count = 0
  for (const stored of listStoredMapPackages()) {
    const summary = summaryFromPackage(stored.packageData)
    registry.registerExported(stored.packageData.manifest.id, stored, summary)
    count += 1
  }
  return count
}

export function registerStoredPackageInRegistry(
  registry: MapPackageRegistry,
  stored: StoredMapPackage,
): void {
  registry.registerExported(
    stored.packageData.manifest.id,
    stored,
    summaryFromPackage(stored.packageData),
  )
}
