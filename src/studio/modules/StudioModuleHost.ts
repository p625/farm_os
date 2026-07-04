import type { StudioStore } from '@/studio/core/StudioStore.ts'

/** Runtime context passed to active Studio modules (v0.2+). */
export interface StudioModuleContext {
  store: StudioStore
  refreshScene: () => void
  deleteSelected: () => boolean
}

export type StudioModuleActivator = (context: StudioModuleContext) => void
export type StudioModuleDeactivator = (context: StudioModuleContext) => void

export interface ActiveStudioModule {
  id: string
  activate?: StudioModuleActivator
  deactivate?: StudioModuleDeactivator
}
