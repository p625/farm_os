import type { IUpdatable } from '@/types/index.ts'
import type { SimulationClock } from '@game/SimulationClock.ts'

export interface SimulationTickTarget {
  update(simulationDeltaTime: number): void
}

export class SimulationDriver implements IUpdatable {
  private readonly clock: SimulationClock
  private readonly simulationTargets: readonly SimulationTickTarget[]
  private readonly realTimeTargets: readonly IUpdatable[]

  constructor(
    clock: SimulationClock,
    simulationTargets: readonly SimulationTickTarget[],
    realTimeTargets: readonly IUpdatable[] = [],
  ) {
    this.clock = clock
    this.simulationTargets = simulationTargets
    this.realTimeTargets = realTimeTargets
  }

  update(realDeltaTime: number): void {
    this.clock.tick(realDeltaTime)
    const simulationDeltaTime = this.clock.getLastSimulationDeltaTime()

    for (const target of this.simulationTargets) {
      target.update(simulationDeltaTime)
    }

    for (const target of this.realTimeTargets) {
      target.update(realDeltaTime)
    }
  }
}
