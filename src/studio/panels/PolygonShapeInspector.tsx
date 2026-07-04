import type { MapObject } from '@/types/world-map.ts'
import { isMapPolygonShape } from '@/types/world-map.ts'
import { polygonArea, polygonCentroid } from '@/studio/polygon/PolygonGeometryUtils.ts'
import { TERRAIN_POLYGON_KIND } from '@/types/terrain-polygon.ts'

interface PolygonShapeInspectorProps {
  object: MapObject
}

export function PolygonShapeInspector({ object }: PolygonShapeInspectorProps) {
  if (object.kind === TERRAIN_POLYGON_KIND) {
    return null
  }

  const shape = object.shape
  if (!shape || !isMapPolygonShape(shape)) {
    return null
  }

  const area = polygonArea(shape.points)
  const centroid = polygonCentroid(shape.points)

  return (
    <>
      <h3 className="studio-panel__subtitle">Polygon</h3>
      <dl className="studio-kv">
        <dt>Vertices</dt>
        <dd>{shape.points.length}</dd>
        <dt>Area</dt>
        <dd>{area.toFixed(1)} m²</dd>
        <dt>Centroid</dt>
        <dd className="studio-kv__mono">
          {centroid.x.toFixed(1)}, {centroid.z.toFixed(1)}
        </dd>
      </dl>
    </>
  )
}
