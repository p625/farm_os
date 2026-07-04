import { assembleMap01WorldDocument } from '@/maps/map-01-blockout/assembleMapDocument.ts'
import { createMap01BlockoutData } from '@/maps/map-01-blockout/layoutSpec.ts'
import { ensureMapTerrainSurface } from '@/studio/terrain/ensureMapTerrainSurface.ts'
import type { Map01BlockoutData } from '@/maps/map-01-blockout/types.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'

/** Assemble Map 01 blockout into a Studio-ready world document. */
export function loadMap01BlockoutDocument(
  data?: Map01BlockoutData,
): WorldMapDocument {
  return ensureMapTerrainSurface(
    assembleMap01WorldDocument(data ?? createMap01BlockoutData()),
  )
}
