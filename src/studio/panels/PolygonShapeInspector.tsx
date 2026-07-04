import type { MapObject } from '@/types/world-map.ts'
import { isMapPolygonShape } from '@/types/world-map.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { polygonArea, polygonCentroid } from '@/studio/polygon/PolygonGeometryUtils.ts'
import {
  TERRAIN_BASE_MATERIALS,
  TERRAIN_POLYGON_KIND,
  parseTerrainPolygonProperties,
} from '@/types/terrain-polygon.ts'

interface PolygonShapeInspectorProps {
  store: StudioStore
  object: MapObject
  onSceneRefresh: () => void
}

export function PolygonShapeInspector({
  store,
  object,
  onSceneRefresh,
}: PolygonShapeInspectorProps) {
  const shape = object.shape
  if (!shape || !isMapPolygonShape(shape)) {
    return null
  }

  const area = polygonArea(shape.points)
  const centroid = polygonCentroid(shape.points)
  const terrainProps =
    object.kind === TERRAIN_POLYGON_KIND
      ? parseTerrainPolygonProperties(object.properties)
      : null

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

      {terrainProps ? (
        <>
          <h3 className="studio-panel__subtitle">Terrain</h3>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Base height</span>
            <input
              className="studio-input"
              type="number"
              step={0.1}
              value={terrainProps.baseHeight}
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value)
                if (Number.isFinite(parsed)) {
                  store.updateTerrainPolygonMetadata(object.id, {
                    baseHeight: parsed,
                  })
                  onSceneRefresh()
                }
              }}
            />
          </label>
          <label className="studio-field studio-field--wide">
            <span className="studio-field__label">Base material</span>
            <select
              className="studio-input"
              value={terrainProps.baseMaterial}
              onChange={(event) => {
                store.updateTerrainPolygonMetadata(object.id, {
                  baseMaterial: event.target
                    .value as (typeof TERRAIN_BASE_MATERIALS)[number],
                })
                onSceneRefresh()
              }}
            >
              {TERRAIN_BASE_MATERIALS.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </label>
          {terrainProps.bounds ? (
            <p className="studio-hint studio-kv__mono">
              bounds X [{terrainProps.bounds.minX.toFixed(0)}…
              {terrainProps.bounds.maxX.toFixed(0)}] Z [
              {terrainProps.bounds.minZ.toFixed(0)}…
              {terrainProps.bounds.maxZ.toFixed(0)}]
            </p>
          ) : null}
        </>
      ) : null}
    </>
  )
}
