import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'

interface InspectorPanelProps {
  store: StudioStore
}

export function InspectorPanel({ store }: InspectorPanelProps) {
  const { selectedObject } = useStudioStore(store)

  if (!selectedObject) {
    return (
      <div className="studio-panel studio-panel--inspector">
        <h2 className="studio-panel__title">Inspector</h2>
        <p className="studio-empty">Click an object in the scene to inspect.</p>
        <p className="studio-hint">v0.1 — selection only, no editing.</p>
      </div>
    )
  }

  const { transform, shape } = selectedObject

  return (
    <div className="studio-panel studio-panel--inspector">
      <h2 className="studio-panel__title">Inspector</h2>
      <dl className="studio-kv">
        <dt>Name</dt>
        <dd>{selectedObject.name ?? '—'}</dd>
        <dt>ID</dt>
        <dd className="studio-kv__mono">{selectedObject.id}</dd>
        <dt>Layer</dt>
        <dd>{selectedObject.layer}</dd>
        <dt>Kind</dt>
        <dd>{selectedObject.kind}</dd>
        <dt>Position</dt>
        <dd className="studio-kv__mono">
          {transform.position.x.toFixed(2)},{' '}
          {transform.position.y.toFixed(2)},{' '}
          {transform.position.z.toFixed(2)}
        </dd>
        {shape ? (
          <>
            <dt>Shape</dt>
            <dd className="studio-kv__mono">
              {shape.type} {shape.width}×{shape.height}×{shape.depth}
            </dd>
          </>
        ) : null}
      </dl>
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
