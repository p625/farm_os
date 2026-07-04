import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { STUDIO_MODULES } from '@/studio/modules/registry.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'

interface ProjectPanelProps {
  store: StudioStore
}

export function ProjectPanel({ store }: ProjectPanelProps) {
  const { map, isDirty } = useStudioStore(store)

  return (
    <div className="studio-panel studio-panel--project">
      <h2 className="studio-panel__title">Project</h2>
      <dl className="studio-kv">
        <dt>Map name</dt>
        <dd>
          <input
            className="studio-input"
            type="text"
            maxLength={80}
            value={map.name}
            onChange={(event) => {
              store.updateMapMetadata({ name: event.target.value })
            }}
          />
        </dd>
        <dt>Map ID</dt>
        <dd>
          <input
            className="studio-input studio-kv__mono"
            type="text"
            maxLength={48}
            value={map.id}
            onChange={(event) => {
              store.updateMapMetadata({ id: event.target.value })
            }}
          />
        </dd>
        <dt>Description</dt>
        <dd>
          <input
            className="studio-input"
            type="text"
            maxLength={160}
            value={map.meta.description ?? ''}
            onChange={(event) => {
              store.updateMapMetadata({ description: event.target.value })
            }}
          />
        </dd>
        <dt>Objects</dt>
        <dd>{map.objects.length}</dd>
        <dt>Terrain</dt>
        <dd>
          {map.terrain.width}×{map.terrain.height}
        </dd>
        <dt>Status</dt>
        <dd>{isDirty ? 'Unsaved changes' : 'Saved'}</dd>
      </dl>
      <h3 className="studio-panel__subtitle">Modules</h3>
      <ul className="studio-module-list">
        {STUDIO_MODULES.map((mod) => (
          <li
            key={mod.id}
            className={`studio-module-list__item${mod.status === 'active' ? ' studio-module-list__item--active' : ''}`}
          >
            <span className="studio-module-list__name">{mod.name}</span>
            <span className="studio-module-list__ver">
              v{mod.version}
              {mod.status === 'active' ? ' · on' : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
