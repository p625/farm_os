import type { StudioLayerId } from '@/types/world-map.ts'
import { STUDIO_LAYER_DEFINITIONS } from '@/studio/core/LayerRegistry.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'

interface LayersPanelProps {
  store: StudioStore
}

export function LayersPanel({ store }: LayersPanelProps) {
  const { layerVisibility, map } = useStudioStore(store)

  const countByLayer = map.objects.reduce<Record<string, number>>(
    (acc, obj) => {
      acc[obj.layer] = (acc[obj.layer] ?? 0) + 1
      return acc
    },
    {},
  )

  return (
    <div className="studio-panel studio-panel--layers">
      <h2 className="studio-panel__title">Layers</h2>
      <ul className="studio-layer-list">
        {STUDIO_LAYER_DEFINITIONS.map((layer) => (
          <li key={layer.id} className="studio-layer-list__item">
            <label className="studio-layer-list__label">
              <input
                type="checkbox"
                checked={layerVisibility[layer.id as StudioLayerId]}
                onChange={(event) => {
                  store.setLayerVisible(
                    layer.id,
                    event.target.checked,
                  )
                }}
              />
              <span className="studio-layer-list__name">{layer.label}</span>
              <span className="studio-layer-list__count">
                {countByLayer[layer.id] ?? 0}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
