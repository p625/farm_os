import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'

interface InspectorPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
  onDeleteSelected: () => void
}

function parseNumber(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function InspectorPanel({
  store,
  onSceneRefresh,
  onDeleteSelected,
}: InspectorPanelProps) {
  const { selectedObject, activeModuleId } = useStudioStore(store)

  if (activeModuleId === 'terrain') {
    return (
      <div className="studio-panel studio-panel--inspector">
        <h2 className="studio-panel__title">Inspector</h2>
        <p className="studio-empty">Terrain module is active.</p>
        <p className="studio-hint">Use Terrain tools on the left — paint on the ground.</p>
      </div>
    )
  }

  if (!selectedObject) {
    return (
      <div className="studio-panel studio-panel--inspector">
        <h2 className="studio-panel__title">Inspector</h2>
        <p className="studio-empty">Click an object in the scene to inspect.</p>
        <p className="studio-hint">Drag to move · corner handles to resize · Del to remove</p>
      </div>
    )
  }

  const { transform, shape } = selectedObject
  const isProtected = selectedObject.id === 'terrain_ground'

  const applyTransform = (
    patch: Parameters<StudioStore['updateObject']>[1],
  ) => {
    if (store.updateObject(selectedObject.id, patch)) {
      onSceneRefresh()
    }
  }

  return (
    <div className="studio-panel studio-panel--inspector">
      <h2 className="studio-panel__title">Inspector</h2>

      <div className="studio-inspector__actions">
        <button
          type="button"
          className="studio-btn studio-btn--danger"
          disabled={isProtected}
          onClick={onDeleteSelected}
          title={isProtected ? 'Ground cannot be deleted' : 'Delete object (Del)'}
        >
          Delete
        </button>
      </div>

      <dl className="studio-kv">
        <dt>Name</dt>
        <dd>
          <input
            className="studio-input"
            type="text"
            value={selectedObject.name ?? ''}
            onChange={(event) => {
              applyTransform({ name: event.target.value })
            }}
          />
        </dd>
        <dt>ID</dt>
        <dd className="studio-kv__mono">{selectedObject.id}</dd>
        <dt>Layer</dt>
        <dd>{selectedObject.layer}</dd>
        <dt>Kind</dt>
        <dd>{selectedObject.kind}</dd>
      </dl>

      <h3 className="studio-panel__subtitle">Transform</h3>
      <div className="studio-field-grid">
        <label className="studio-field">
          <span className="studio-field__label">X</span>
          <input
            className="studio-input"
            type="number"
            step="0.1"
            value={transform.position.x}
            onChange={(event) => {
              applyTransform({
                transform: {
                  position: {
                    x: parseNumber(event.target.value, transform.position.x),
                  },
                },
              })
            }}
          />
        </label>
        <label className="studio-field">
          <span className="studio-field__label">Y</span>
          <input
            className="studio-input"
            type="number"
            step="0.01"
            value={transform.position.y}
            onChange={(event) => {
              applyTransform({
                transform: {
                  position: {
                    y: parseNumber(event.target.value, transform.position.y),
                  },
                },
              })
            }}
          />
        </label>
        <label className="studio-field">
          <span className="studio-field__label">Z</span>
          <input
            className="studio-input"
            type="number"
            step="0.1"
            value={transform.position.z}
            onChange={(event) => {
              applyTransform({
                transform: {
                  position: {
                    z: parseNumber(event.target.value, transform.position.z),
                  },
                },
              })
            }}
          />
        </label>
        <label className="studio-field studio-field--wide">
          <span className="studio-field__label">Rotation Y</span>
          <input
            className="studio-input"
            type="number"
            step="0.05"
            value={transform.rotationY ?? 0}
            onChange={(event) => {
              applyTransform({
                transform: {
                  rotationY: parseNumber(
                    event.target.value,
                    transform.rotationY ?? 0,
                  ),
                },
              })
            }}
          />
        </label>
      </div>

      {shape?.type === 'box' ? (
        <>
          <h3 className="studio-panel__subtitle">Shape</h3>
          <div className="studio-field-grid">
            <label className="studio-field">
              <span className="studio-field__label">W</span>
              <input
                className="studio-input"
                type="number"
                min="0.1"
                step="0.1"
                value={shape.width}
                onChange={(event) => {
                  applyTransform({
                    shape: {
                      width: parseNumber(event.target.value, shape.width),
                    },
                  })
                }}
              />
            </label>
            <label className="studio-field">
              <span className="studio-field__label">H</span>
              <input
                className="studio-input"
                type="number"
                min="0.01"
                step="0.01"
                value={shape.height}
                onChange={(event) => {
                  applyTransform({
                    shape: {
                      height: parseNumber(event.target.value, shape.height),
                    },
                  })
                }}
              />
            </label>
            <label className="studio-field">
              <span className="studio-field__label">D</span>
              <input
                className="studio-input"
                type="number"
                min="0.1"
                step="0.1"
                value={shape.depth}
                onChange={(event) => {
                  applyTransform({
                    shape: {
                      depth: parseNumber(event.target.value, shape.depth),
                    },
                  })
                }}
              />
            </label>
          </div>
        </>
      ) : null}

      {selectedObject.properties &&
      Object.keys(selectedObject.properties).length > 0 ? (
        <>
          <h3 className="studio-panel__subtitle">Properties</h3>
          <pre className="studio-json">
            {JSON.stringify(selectedObject.properties, null, 2)}
          </pre>
        </>
      ) : null}
    </div>
  )
}
