import type { IUpdatable } from '@/types/index.ts'

export class GameLoop {
  private animationFrameId: number | null = null
  private lastTimestamp = 0
  private running = false
  private readonly updatables: readonly IUpdatable[]

  constructor(updatables: readonly IUpdatable[]) {
    this.updatables = updatables
  }

  start(render: () => void): void {
    if (this.running) {
      return
    }

    this.running = true
    this.lastTimestamp = performance.now()

    const tick = (timestamp: number) => {
      if (!this.running) {
        return
      }

      const deltaTime = (timestamp - this.lastTimestamp) / 1000
      this.lastTimestamp = timestamp

      for (const updatable of this.updatables) {
        updatable.update(deltaTime)
      }

      render()
      this.animationFrameId = requestAnimationFrame(tick)
    }

    this.animationFrameId = requestAnimationFrame(tick)
  }

  stop(): void {
    this.running = false

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
}
