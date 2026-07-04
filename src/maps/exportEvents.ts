export const FARMOS_EXPORTS_CHANGED_EVENT = 'farmos-exports-changed'

export function notifyExportsChanged(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.dispatchEvent(new CustomEvent(FARMOS_EXPORTS_CHANGED_EVENT))
}
