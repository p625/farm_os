import {
  DEFAULT_REAL_MINUTES_PER_GAME_DAY,
  SIMULATION_SECONDS_PER_DAY,
  type RealMinutesPerGameDay,
  type TimeScale,
} from '@/types/simulation-clock.ts'

export function formatSimulationTimeOfDay(dayFraction: number): string {
  const totalMinutes = Math.floor(dayFraction * 24 * 60) % (24 * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function getSimulationSecondsPerRealSecond(
  realMinutesPerGameDay: number,
): number {
  const realSecondsPerDay = Math.max(1, realMinutesPerGameDay * 60)
  return SIMULATION_SECONDS_PER_DAY / realSecondsPerDay
}

export class SimulationClock {
  private realMinutesPerGameDay: RealMinutesPerGameDay =
    DEFAULT_REAL_MINUTES_PER_GAME_DAY
  private timeScale: TimeScale = 1
  private dayFraction = 0
  private lastSimulationDeltaTime = 0
  private readonly onDayAdvancedListeners = new Set<() => void>()

  getRealMinutesPerGameDay(): RealMinutesPerGameDay {
    return this.realMinutesPerGameDay
  }

  setRealMinutesPerGameDay(minutes: RealMinutesPerGameDay): void {
    this.realMinutesPerGameDay = minutes
  }

  getTimeScale(): TimeScale {
    return this.timeScale
  }

  setTimeScale(scale: TimeScale): void {
    this.timeScale = scale
  }

  isPaused(): boolean {
    return this.timeScale === 0
  }

  getDayFraction(): number {
    return this.dayFraction
  }

  setDayFraction(fraction: number): void {
    this.dayFraction = Math.min(1, Math.max(0, fraction))
  }

  getTimeOfDayLabel(): string {
    return formatSimulationTimeOfDay(this.dayFraction)
  }

  getLastSimulationDeltaTime(): number {
    return this.lastSimulationDeltaTime
  }

  /** @deprecated Use getTimeScale — kept for snapshot migration. */
  getLegacyGameSpeed(): number {
    return this.timeScale
  }

  addOnDayAdvanced(listener: () => void): () => void {
    this.onDayAdvancedListeners.add(listener)
    return () => this.onDayAdvancedListeners.delete(listener)
  }

  tick(realDeltaSeconds: number): number {
    if (this.timeScale === 0 || realDeltaSeconds <= 0) {
      this.lastSimulationDeltaTime = 0
      return 0
    }

    const simulationDeltaTime =
      realDeltaSeconds *
      getSimulationSecondsPerRealSecond(this.realMinutesPerGameDay) *
      this.timeScale

    this.lastSimulationDeltaTime = simulationDeltaTime

    const dayAdvance = simulationDeltaTime / SIMULATION_SECONDS_PER_DAY
    this.dayFraction += dayAdvance

    while (this.dayFraction >= 1) {
      this.dayFraction -= 1
      for (const listener of this.onDayAdvancedListeners) {
        listener()
      }
    }

    return simulationDeltaTime
  }
}
