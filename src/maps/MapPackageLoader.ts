import { CAMERA_PROFILES } from '@/config/camera-profiles.ts'
import { FIELD_CATALOG } from '@/config/field-catalog.ts'
import type { FieldLayoutEntry } from '@/config/map-01-layout.ts'
import {
  FARM_HUB,
  FIELD_LAYOUT,
  MAP_01_WORLD_BOUNDS,
} from '@/config/map-01-layout.ts'
import type { MapPackageData, MapPackageManifest, MapPackageSummary } from '@/types/map-package.ts'
import type { MapRuntimeContext } from '@/maps/MapRuntimeContext.ts'
import type { StoredMapPackage } from '@/studio/export/WorldMapExporter.ts'
import {
  ensurePackageData,
  findStoredMapPackage,
} from '@/maps/ExportedMapStorage.ts'
import { MapFileService } from '@/studio/io/MapFileService.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validateManifest(raw: unknown): MapPackageManifest {
  if (!isRecord(raw)) {
    throw new Error('Invalid map package manifest')
  }
  if (raw.packageFormatVersion !== 1) {
    throw new Error(`Unsupported map package format: ${String(raw.packageFormatVersion)}`)
  }
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') {
    throw new Error('Map package manifest missing id or name')
  }
  return raw as unknown as MapPackageManifest
}

export function buildMapRuntimeContext(
  packageData: MapPackageData,
  stored?: StoredMapPackage,
): MapRuntimeContext {
  const layout = packageData.layout
  return {
    packageData,
    manifest: packageData.manifest,
    layout,
    fields: packageData.fields,
    fieldLayout: layout.fieldLayout as readonly FieldLayoutEntry[],
    farmHub: layout.farmHub,
    worldBounds: layout.worldBounds,
    cameraProfiles: packageData.cameraProfiles,
    worldMap: stored?.worldMap,
  }
}

export async function loadMapPackageFromUrl(baseUrl: string): Promise<MapRuntimeContext> {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

  const manifestResponse = await fetch(`${normalizedBase}package.json`)
  if (!manifestResponse.ok) {
    throw new Error(`Failed to load map manifest from ${normalizedBase}`)
  }

  const manifest = validateManifest(await manifestResponse.json())

  const [layoutResponse, fieldsResponse, cameraResponse] = await Promise.all([
    fetch(`${normalizedBase}layout.json`),
    fetch(`${normalizedBase}fields.json`),
    fetch(`${normalizedBase}camera-profiles.json`),
  ])

  if (!layoutResponse.ok || !fieldsResponse.ok || !cameraResponse.ok) {
    throw new Error(`Failed to load map data files for ${manifest.id}`)
  }

  const packageData: MapPackageData = {
    manifest,
    layout: await layoutResponse.json(),
    fields: await fieldsResponse.json(),
    cameraProfiles: await cameraResponse.json(),
  }

  let worldMap: WorldMapDocument | undefined
  if (manifest.worldMapFile) {
    try {
      const worldMapResponse = await fetch(`${normalizedBase}${manifest.worldMapFile}`)
      if (worldMapResponse.ok) {
        worldMap = MapFileService.parse(await worldMapResponse.text())
      }
    } catch {
      // Fall back to layout-only package when world map is unavailable.
    }
  }

  return buildMapRuntimeContext(
    packageData,
    worldMap ? { packageData, worldMap } : undefined,
  )
}

/** Built-in fallback when package fetch is unavailable (dev / tests). */
export function createBuiltinMap01Context(): MapRuntimeContext {
  const manifest: MapPackageManifest = {
    packageFormatVersion: 1,
    id: 'map_01',
    name: 'Map 01 — Central Europe',
    version: '1.0.0',
    author: 'FarmOS',
    description: 'Central European starter farm with blocks A, B, and C.',
    source: 'official',
    fieldCount: FIELD_CATALOG.length,
    blockIds: ['A', 'B', 'C'],
  }

  const packageData: MapPackageData = {
    manifest,
    layout: {
      worldBounds: MAP_01_WORLD_BOUNDS,
      terrain: {
        width: MAP_01_WORLD_BOUNDS.maxX - MAP_01_WORLD_BOUNDS.minX,
        depth: MAP_01_WORLD_BOUNDS.maxZ - MAP_01_WORLD_BOUNDS.minZ,
      },
      farmHub: FARM_HUB,
      fieldLayout: [...FIELD_LAYOUT],
    },
    fields: [...FIELD_CATALOG],
    cameraProfiles: Object.values(CAMERA_PROFILES).map((profile) => ({
      id: profile.id,
      label: profile.id,
      alpha: profile.alpha,
      beta: profile.beta,
      radius: profile.radius,
      targetOffset: profile.target,
    })),
  }

  return buildMapRuntimeContext(packageData)
}

export class MapPackageRegistry {
  private readonly summaries = new Map<string, MapPackageSummary>()
  private readonly baseUrls = new Map<string, string>()
  private readonly exportedPackages = new Map<string, StoredMapPackage>()

  register(baseUrl: string, summary?: MapPackageSummary): void {
    const id = summary?.id ?? baseUrl.split('/').filter(Boolean).pop() ?? baseUrl
    this.baseUrls.set(id, baseUrl)
    if (summary) {
      this.summaries.set(id, summary)
    }
  }

  registerExported(
    mapId: string,
    stored: StoredMapPackage,
    summary?: MapPackageSummary,
  ): void {
    const resolvedId = stored.packageData.manifest.id
    this.exportedPackages.set(mapId, stored)
    if (resolvedId !== mapId) {
      this.exportedPackages.set(resolvedId, stored)
    }
    this.summaries.set(resolvedId, summary ?? {
      id: stored.packageData.manifest.id,
      name: stored.packageData.manifest.name,
      description: stored.packageData.manifest.description,
      version: stored.packageData.manifest.version,
      author: stored.packageData.manifest.author,
      preview: stored.packageData.manifest.preview,
      source: stored.packageData.manifest.source,
      fieldCount: stored.packageData.fields.length,
      blockIds: [...new Set(stored.packageData.fields.map((field) => field.blockId))],
    })
  }

  unregisterExported(mapId: string): void {
    this.exportedPackages.delete(mapId)
    if (!this.baseUrls.has(mapId)) {
      this.summaries.delete(mapId)
    }
  }

  isExportedMap(mapId: string): boolean {
    if (this.exportedPackages.has(mapId)) {
      return true
    }
    return findStoredMapPackage(mapId) !== null
  }

  getSummaries(): MapPackageSummary[] {
    return [...this.summaries.values()].sort((a, b) => {
      if (a.source !== b.source) {
        return a.source === 'official' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }

  getSummary(mapId: string): MapPackageSummary | undefined {
    return this.summaries.get(mapId)
  }

  async load(mapId: string): Promise<MapRuntimeContext> {
    let stored = this.exportedPackages.get(mapId)
    if (!stored) {
      const fromStorage = findStoredMapPackage(mapId)
      if (fromStorage) {
        stored = fromStorage
        this.registerExported(fromStorage.packageData.manifest.id, fromStorage)
        if (fromStorage.packageData.manifest.id !== mapId) {
          this.exportedPackages.set(mapId, fromStorage)
        }
      }
    }

    if (stored) {
      const packageData = ensurePackageData(stored)
      const context = buildMapRuntimeContext(packageData, {
        ...stored,
        packageData,
      })
      return context
    }

    const baseUrl = this.baseUrls.get(mapId)
    if (!baseUrl) {
      if (mapId === 'map_01') {
        return createBuiltinMap01Context()
      }
      throw new Error(`Unknown map package: ${mapId}`)
    }

    try {
      const context = await loadMapPackageFromUrl(baseUrl)
      this.summaries.set(mapId, {
        id: context.manifest.id,
        name: context.manifest.name,
        description: context.manifest.description,
        version: context.manifest.version,
        author: context.manifest.author,
        preview: context.manifest.preview,
        source: context.manifest.source,
        fieldCount: context.fields.length,
        blockIds: [...new Set(context.fields.map((field) => field.blockId))],
      })
      return context
    } catch {
      if (mapId === 'map_01') {
        return createBuiltinMap01Context()
      }
      throw new Error(`Failed to load map package: ${mapId}`)
    }
  }
}

export const defaultMapPackageRegistry = new MapPackageRegistry()

defaultMapPackageRegistry.register('/maps/map_01', {
  id: 'map_01',
  name: 'Map 01 — Legacy Prototype',
  description: 'Small prototype layout (~140 m) for regression testing.',
  version: '1.0.0',
  author: 'FarmOS',
  preview: 'preview.png',
  source: 'official',
  fieldCount: FIELD_CATALOG.length,
  blockIds: ['A', 'B', 'C'],
})

defaultMapPackageRegistry.register('/maps/Map_01_Central_Europe', {
  id: 'map_01_central_europe',
  name: 'Map 01 — Central Europe',
  description:
    'Produkční blockout — středoevropská kotlinová krajina (4×4 km), farma na návrší, vesnice na hřebeni.',
  version: '1.0.0',
  author: 'FarmOS',
  source: 'official',
  fieldCount: 9,
  blockIds: ['A', 'B', 'C'],
})

defaultMapPackageRegistry.register('/maps/GameplayPlacementTest', {
  id: 'gameplay_placement_test',
  name: 'Gameplay Placement E2E Test',
  description:
    'Dealer, silo, tractor, plow, seeder, trailer — ověření Studio → runtime řetězce.',
  version: '1.0.0',
  author: 'FarmOS E2E',
  source: 'official',
  fieldCount: 0,
  blockIds: [],
})
