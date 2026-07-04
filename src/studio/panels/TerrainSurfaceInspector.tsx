import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { TERRAIN_BASE_MATERIALS } from '@/types/terrain-polygon.ts'

interface TerrainSurfaceInspectorProps {
  store: StudioStore
}

export function TerrainSurfaceInspector({ store }: TerrainSurfaceInspectorProps) {
  const map = store.getMap()
  const ground = map.objects.find((object) => object.id === 'terrain_ground')
  if (!ground || ground.shape?.type !== 'box') {
    return null
  }

  const field = ensureTerrainHeightfield(map.terrain)
  const baseMaterial =
    typeof ground.properties?.baseMaterial === 'string' &&
    (TERRAIN_BASE_MATERIALS as readonly string[]).includes(ground.properties.baseMaterial)
      ? (ground.properties.baseMaterial as (typeof TERRAIN_BASE_MATERIALS)[number])
      : 'grass'

  return (
    <>
      <h3 className="studio-panel__subtitle">Terrain Surface</h3>
      <p className="studio-hint">
        Heightfield mesh rendered in game and studio. Edited via sculpt / surface paint.
      </p>
      <dl className="studio-kv">
        <dt>Object</dt>
        <dd className="studio-kv__mono">terrain_ground</dd>
        <dt>Resolution</dt>
        <dd>{field.resolution}×{field.resolution}</dd>
        <dt>Size</dt>
        <dd>
          {ground.shape.width.toFixed(0)} × {ground.shape.depth.toFixed(0)} m
        </dd>
        <dt>Base height</dt>
        <dd>{ground.transform.position.y.toFixed(2)}</dd>
      </dl>
      <label className="studio-field studio-field--wide">
        <span className="studio-field__label">Default material</span>
        <select
          className="studio-input"
          value={baseMaterial}
          onChange={(event) => {
            store.updateTerrainGroundMetadata({
              baseMaterial: event.target
                .value as (typeof TERRAIN_BASE_MATERIALS)[number],
            })
          }}
        >
          {TERRAIN_BASE_MATERIALS.map((material) => (
            <option key={material} value={material}>
              {material}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}
