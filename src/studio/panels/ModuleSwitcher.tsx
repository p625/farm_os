import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import type { StudioModuleId } from '@/studio/core/StudioStore.ts'
import { STUDIO_MODULES } from '@/studio/modules/registry.ts'

interface ModuleSwitcherProps {
  store: StudioStore
}

const ACTIVE_MODULES: StudioModuleId[] = ['transform', 'terrain', 'roads']

export function ModuleSwitcher({ store }: ModuleSwitcherProps) {
  const { activeModuleId } = useStudioStore(store)

  return (
    <div className="studio-module-switcher">
      {STUDIO_MODULES.filter((mod) =>
        ACTIVE_MODULES.includes(mod.id as StudioModuleId),
      ).map((mod) => (
        <button
          key={mod.id}
          type="button"
          className={`studio-btn studio-module-switcher__btn${
            activeModuleId === mod.id ? ' studio-module-switcher__btn--active' : ''
          }`}
          onClick={() => store.setActiveModule(mod.id as StudioModuleId)}
          title={mod.description}
        >
          {mod.name}
        </button>
      ))}
    </div>
  )
}
