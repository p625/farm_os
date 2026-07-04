import type { MapObject } from '@/types/world-map.ts'
import { isMapPolygonShape } from '@/types/world-map.ts'
import { polygonArea, polygonCentroid } from '@/studio/polygon/PolygonGeometryUtils.ts'
import { parseTerrainPolygonProperties } from '@/types/terrain-polygon.ts'

interface TerrainBoundaryInspectorProps {
  object: MapObject
}

export function TerrainBoundaryInspector({ object }: TerrainBoundaryInspectorProps) {
  const shape = object.shape
  if (!shape || !isMapPolygonShape(shape)) {
    return null
  }

  const area = polygonArea(shape.points)
  const centroid = polygonCentroid(shape.points)
  const props = parseTerrainPolygonProperties(object.properties)

  return (
    <>
      <h3 className="studio-panel__subtitle">Terrain Boundary</h3>
      <p className="studio-hint">
        Editor outline only — not rendered as terrain surface. Drives terrain bounds sync.
      </p>
      <dl className="studio-kv">
        <dt>ID</dt>
        <dd className="studio-kv__mono">{object.id}</dd>
        <dt>Vertices</dt>
        <dd>{shape.points.length}</dd>
        <dt>Area</dt>
        <dd>{area.toFixed(1)} m²</dd>
        <dt>Centroid</dt>
        <dd className="studio-kv__mono">
          {centroid.x.toFixed(1)}, {centroid.z.toFixed(1)}
        </dd>
      </dl>
      {props?.bounds ? (
        <p className="studio-hint studio-kv__mono">
          Bounds X [{props.bounds.minX.toFixed(0)}…{props.bounds.maxX.toFixed(0)}] Z [
          {props.bounds.minZ.toFixed(0)}…{props.bounds.maxZ.toFixed(0)}]
        </p>
      ) : null}
    </>
  )
}
