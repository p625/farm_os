import type { SkySystem } from '@/rendering/sky/SkySystem.ts'

export function logSkyDebugReport(sky: SkySystem): void {
  if (!import.meta.env?.DEV) {
    return
  }

  const report = sky.getRuntimeReport()
  console.info('[FarmOS Sky]', report)
}
