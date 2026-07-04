import { useSyncExternalStore } from 'react'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { EMPTY_STUDIO_SNAPSHOT } from '@/studio/core/StudioStore.ts'

export function useStudioStore(store: StudioStore | null) {
  return useSyncExternalStore(
    (listener) => {
      if (!store) {
        return () => undefined
      }
      return store.subscribe(listener)
    },
    () => store?.getSnapshot() ?? EMPTY_STUDIO_SNAPSHOT,
    () => EMPTY_STUDIO_SNAPSHOT,
  )
}
