import type { WorldMapDocument } from '@/types/world-map.ts'
import type { MapPolygonPoint } from '@/types/world-map.ts'
import type { PolygonValidationResult } from '@/studio/polygon/PolygonEditorTypes.ts'
import {
  MIN_POLYGON_AREA,
  MIN_POLYGON_POINTS,
  hasDuplicateAdjacentVertices,
  polygonArea,
  polygonBoundingFootprint,
  polygonSelfIntersects,
} from '@/studio/polygon/PolygonGeometryUtils.ts'
import { validateParcelFootprint } from '@/studio/parcel/ParcelValidation.ts'

export function validatePolygonGeometry(
  map: WorldMapDocument,
  points: readonly MapPolygonPoint[],
  excludeObjectId?: string,
): PolygonValidationResult {
  if (points.length < MIN_POLYGON_POINTS) {
    return {
      ok: false,
      message: `Polygon needs at least ${MIN_POLYGON_POINTS} vertices.`,
    }
  }

  if (hasDuplicateAdjacentVertices(points)) {
    return {
      ok: false,
      message: 'Polygon has duplicate adjacent vertices.',
    }
  }

  if (polygonArea(points) < MIN_POLYGON_AREA) {
    return {
      ok: false,
      message: `Polygon area must be at least ${MIN_POLYGON_AREA} m².`,
    }
  }

  if (polygonSelfIntersects(points)) {
    return {
      ok: false,
      message: 'Polygon must not self-intersect.',
    }
  }

  return validateParcelFootprint(
    map,
    polygonBoundingFootprint(points),
    excludeObjectId,
  )
}
