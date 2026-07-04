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
        <dt>Map</dt>
        <dd>{map.name}</dd>
        <dt>ID</dt>
        <dd className="studio-kv__mono">{map.id}</dd>
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
          <li key={mod.id} className="studio-module-list__item">
            <span className="studio-module-list__name">{mod.name}</span>
            <span className="studio-module-list__ver">v{mod.version}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
