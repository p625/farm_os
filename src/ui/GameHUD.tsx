import { useEffect, useRef, useState } from 'react'
import { formatFieldState } from '@systems/FieldSystem.ts'
import {
  formatJobType,
  formatTractorState,
} from '@systems/TractorJobSystem.ts'
import type { Game } from '@core/Game.ts'
import type { GameSnapshot } from '@core/GameSnapshot.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import { TractorState } from '@/types/tractor.ts'
import './GameHUD.css'

interface GameHUDProps {
  game: Game
  snapshot: GameSnapshot
}

const GAME_SPEED_OPTIONS = [1, 2, 3, 5] as const

function MoneyDisplay({ snapshot }: { snapshot: GameSnapshot }) {
  const [popVisible, setPopVisible] = useState(false)
  const lastGainId = useRef(0)

  useEffect(() => {
    const gain = snapshot.moneyGain
    if (!gain || gain.id === lastGainId.current) {
      return
    }

    lastGainId.current = gain.id
    setPopVisible(true)
    const timer = window.setTimeout(() => {
      setPopVisible(false)
    }, 1400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [snapshot.moneyGain])

  return (
    <div className="game-hud__money">
      <dd>₡{snapshot.money.toLocaleString()}</dd>
      {popVisible && snapshot.moneyGain ? (
        <span className="game-hud__money-pop" key={snapshot.moneyGain.id}>
          +₡{snapshot.moneyGain.amount.toLocaleString()}
        </span>
      ) : null}
    </div>
  )
}

export function GameHUD({ game, snapshot }: GameHUDProps) {
  const selectedField = snapshot.fields.find(
    (field) => field.id === snapshot.selectedFieldId,
  )

  const tractorBusy = snapshot.tractor.state !== TractorState.Idle
  const canPlow = !tractorBusy && selectedField?.state === States.Grass
  const canSeed = !tractorBusy && selectedField?.state === States.Plowed
  const canHarvest = !tractorBusy && selectedField?.state === States.Harvestable

  const activeJob = snapshot.tractor.activeJob

  return (
    <aside className="game-hud">
      <header className="game-hud__header">
        <h1 className="game-hud__title">FarmOS</h1>
        <p className="game-hud__subtitle">Milestone 3 — Better Game Feel</p>
      </header>

      <section className="game-hud__panel">
        <h2 className="game-hud__section-title">Farm Status</h2>
        <dl className="game-hud__stats">
          <div className="game-hud__stat game-hud__stat--money">
            <dt>Money</dt>
            <MoneyDisplay snapshot={snapshot} />
          </div>
          <div className="game-hud__stat">
            <dt>Day</dt>
            <dd>{snapshot.currentDay}</dd>
          </div>
          <div className="game-hud__stat">
            <dt>Game speed</dt>
            <dd>{snapshot.gameSpeed}×</dd>
          </div>
        </dl>
      </section>

      <section className="game-hud__panel">
        <h2 className="game-hud__section-title">Event Log</h2>
        {snapshot.eventLog.length > 0 ? (
          <ul className="game-hud__event-log">
            {snapshot.eventLog.map((entry) => (
              <li key={entry.id} className="game-hud__event">
                <span className="game-hud__event-day">Day {entry.day}</span>
                <span className="game-hud__event-message">{entry.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="game-hud__hint">Farm events will appear here.</p>
        )}
      </section>

      <section className="game-hud__panel">
        <h2 className="game-hud__section-title">Tractor</h2>
        <dl className="game-hud__stats">
          <div className="game-hud__stat">
            <dt>State</dt>
            <dd>{formatTractorState(snapshot.tractor.state)}</dd>
          </div>
          {activeJob ? (
            <>
              <div className="game-hud__stat">
                <dt>Job</dt>
                <dd>
                  {formatJobType(activeJob.type)} — {activeJob.fieldName}
                </dd>
              </div>
              {snapshot.tractor.state === TractorState.Working ? (
                <div className="game-hud__stat">
                  <dt>Work</dt>
                  <dd>{Math.round(snapshot.tractor.workProgress * 100)}%</dd>
                </div>
              ) : null}
            </>
          ) : (
            <p className="game-hud__hint">No active job.</p>
          )}
        </dl>
        {snapshot.tractor.state === TractorState.Working ? (
          <div className="game-hud__progress">
            <div
              className="game-hud__progress-fill"
              style={{ width: `${snapshot.tractor.workProgress * 100}%` }}
            />
          </div>
        ) : null}
      </section>

      <section className="game-hud__panel">
        <h2 className="game-hud__section-title">Selected Field</h2>
        {selectedField ? (
          <dl className="game-hud__stats">
            <div className="game-hud__stat">
              <dt>Name</dt>
              <dd>{selectedField.name}</dd>
            </div>
            <div className="game-hud__stat">
              <dt>State</dt>
              <dd>{formatFieldState(selectedField.state)}</dd>
            </div>
            <div className="game-hud__stat">
              <dt>Crop</dt>
              <dd>{selectedField.cropId ?? '—'}</dd>
            </div>
            <div className="game-hud__stat">
              <dt>Growth</dt>
              <dd>{Math.round(selectedField.growthPercent)}%</dd>
            </div>
          </dl>
        ) : (
          <p className="game-hud__hint">Click a field on the map to select it.</p>
        )}
      </section>

      <section className="game-hud__panel">
        <h2 className="game-hud__section-title">Actions</h2>
        <div className="game-hud__actions">
          <button
            type="button"
            className="game-hud__button"
            disabled={!canPlow}
            onClick={() => game.plowSelectedField()}
          >
            Plow
          </button>
          <button
            type="button"
            className="game-hud__button"
            disabled={!canSeed}
            onClick={() => game.seedSelectedField()}
          >
            Seed Wheat
          </button>
          <button
            type="button"
            className="game-hud__button game-hud__button--primary"
            disabled={!canHarvest}
            onClick={() => game.harvestSelectedField()}
          >
            Harvest
          </button>
        </div>
        {tractorBusy ? (
          <p className="game-hud__hint">Tractor is busy — wait for the current job.</p>
        ) : null}
      </section>

      <section className="game-hud__panel">
        <h2 className="game-hud__section-title">Time Control</h2>
        <div className="game-hud__speeds">
          {GAME_SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              type="button"
              className={
                snapshot.gameSpeed === speed
                  ? 'game-hud__speed game-hud__speed--active'
                  : 'game-hud__speed'
              }
              onClick={() => game.setGameSpeed(speed)}
            >
              {speed}×
            </button>
          ))}
        </div>
        <p className="game-hud__hint">1 real second ≈ 1 game day at 1× speed.</p>
      </section>

      <section className="game-hud__panel game-hud__panel--fields">
        <h2 className="game-hud__section-title">All Fields</h2>
        <ul className="game-hud__field-list">
          {snapshot.fields.map((field) => (
            <li key={field.id}>
              <button
                type="button"
                className={
                  field.id === snapshot.selectedFieldId
                    ? 'game-hud__field-item game-hud__field-item--active'
                    : 'game-hud__field-item'
                }
                onClick={() => game.selectField(field.id)}
              >
                {field.name}: {formatFieldState(field.state)} (
                {Math.round(field.growthPercent)}%)
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
