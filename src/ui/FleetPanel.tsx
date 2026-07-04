import type { Game } from '@core/Game.ts'
import type { FleetMachineSnapshot } from '@/types/machine-fleet.ts'
import { FleetMachineCard } from './FleetMachineCard.tsx'
import './FleetPanel.css'

interface FleetPanelProps {
  game: Game
  open: boolean
  fleet: readonly FleetMachineSnapshot[]
}

export function FleetPanel({ game, open, fleet }: FleetPanelProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fleet-panel" role="dialog" aria-label="Fleet overview">
      <button
        type="button"
        className="fleet-panel__backdrop"
        aria-label="Close fleet panel"
        onClick={() => game.closeFleetPanel()}
      />
      <section className="fleet-panel__sheet">
        <header className="fleet-panel__header">
          <div>
            <p className="fleet-panel__eyebrow">Fleet</p>
            <h2>Machine overview</h2>
          </div>
          <button
            type="button"
            className="fleet-panel__close game-hud__button"
            onClick={() => game.closeFleetPanel()}
          >
            Close
          </button>
        </header>

        {fleet.length === 0 ? (
          <p className="fleet-panel__empty">No machines owned yet.</p>
        ) : (
          <div className="fleet-panel__list">
            {fleet.map((machine) => (
              <FleetMachineCard
                key={machine.machineId}
                machine={machine}
                onSelect={() => game.selectMachineFromFleet(machine.machineId)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
