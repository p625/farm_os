import type { WorldMapDocument } from '@/types/world-map.ts'
import { WORLD_MAP_FORMAT_VERSION } from '@/types/world-map.ts'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { migrateLegacyBuildings } from '@/studio/building/migrateLegacyBuildings.ts'
import { ensureMapTerrainSurface } from '@/studio/terrain/ensureMapTerrainSurface.ts'

export class MapFileService {
  static serialize(map: WorldMapDocument): string {
    const payload = {
      ...map,
      meta: {
        ...map.meta,
        updatedAt: new Date().toISOString(),
      },
    }
    return JSON.stringify(payload, null, 2)
  }

  static parse(json: string): WorldMapDocument {
    const data = JSON.parse(json) as WorldMapDocument
    if (data.formatVersion !== WORLD_MAP_FORMAT_VERSION) {
      throw new Error(
        `Unsupported map format version: ${String(data.formatVersion)}`,
      )
    }
    if (!data.id || !data.name || !Array.isArray(data.objects)) {
      throw new Error('Invalid map document structure.')
    }
    return ensureMapTerrainSurface(
      migrateLegacyBuildings({
        ...data,
        terrain: ensureTerrainHeightfield(data.terrain),
      }),
    )
  }

  static download(map: WorldMapDocument, filename?: string): void {
    const blob = new Blob([MapFileService.serialize(map)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename ?? `${map.id}.farmos-map.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  static async loadFromFile(file: File): Promise<WorldMapDocument> {
    const text = await file.text()
    return MapFileService.parse(text)
  }

  static async tryFetch(path: string): Promise<WorldMapDocument | null> {
    try {
      const response = await fetch(path)
      if (!response.ok) {
        return null
      }
      return MapFileService.parse(await response.text())
    } catch {
      return null
    }
  }
}
