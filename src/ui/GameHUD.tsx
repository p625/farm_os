import { useEffect, useRef, useState } from 'react'
import { formatFieldState } from '@systems/FieldSystem.ts'
import { formatFieldOwnership } from '@systems/OwnershipSystem.ts'
import {
  formatJobType,
  formatTractorState,
} from '@systems/TractorJobSystem.ts'
import type { Game } from '@core/Game.ts'
import type { GameSnapshot } from '@core/GameSnapshot.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import { FieldOwnership } from '@/types/ownership.ts'
import { TractorState } from '@/types/tractor.ts'
import { ChooseCropDialog } from './ChooseCropDialog.tsx'
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
  const [confirmReset, setConfirmReset] = useState(false)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const selectedField = snapshot.fields.find(
    (field) => field.id === snapshot.selectedFieldId,
  )

  const tractorBusy = snapshot.tractor.state !== TractorState.Idle
  const fieldUsable = selectedField?.usable ?? false
  const isAvailableField =
    selectedField?.ownership === FieldOwnership.Available

  const canPlow =
    !tractorBusy && fieldUsable && selectedField?.state === States.Grass
  const canChooseCrop =
    !tractorBusy && fieldUsable && selectedField?.state === States.Plowed
  const canAffordAnyCrop = snapshot.crops.some(
    (crop) => snapshot.money >= crop.seedCost,
  )
  const canHarvest =
    !tractorBusy && fieldUsable && selectedField?.state === States.Harvestable

  const canPurchase =
    isAvailableField &&
    selectedField !== undefined &&
    snapshot.money >= selectedField.purchasePrice
  const canLease =
    isAvailableField &&
    selectedField !== undefined &&
    snapshot.money >= selectedField.leasePrice

  const activeJob = snapshot.tractor.activeJob

  return (
    <aside className="game-hud">
      <header className="game-hud__header">
        <h1 className="game-hud__title">FarmOS</h1>
        <p className="game-hud__subtitle">Phase 7 — Crop System</p>
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
                  {formatJobType(activeJob.type, activeJob.cropName)} —{' '}
                  {activeJob.fieldName}
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
              <dt>Ownership</dt>
              <dd>{formatFieldOwnership(selectedField.ownership)}</dd>
            </div>
            <div className="game-hud__stat">
              <dt>Area</dt>
              <dd>{selectedField.area} ha</dd>
            </div>
            <div className="game-hud__stat">
              <dt>Fertility</dt>
              <dd>{selectedField.fertility}%</dd>
            </div>
            {isAvailableField ? (
              <>
                <div className="game-hud__stat">
                  <dt>Purchase</dt>
                  <dd>₡{selectedField.purchasePrice.toLocaleString()}</dd>
                </div>
                <div className="game-hud__stat">
                  <dt>Lease</dt>
                  <dd>₡{selectedField.leasePrice.toLocaleString()}</dd>
                </div>
              </>
            ) : (
              <>
                <div className="game-hud__stat">
                  <dt>State</dt>
                  <dd>{formatFieldState(selectedField.state)}</dd>
                </div>
                <div className="game-hud__stat">
                  <dt>Crop</dt>
                  <dd>{selectedField.cropName ?? '—'}</dd>
                </div>
                <div className="game-hud__stat">
                  <dt>Growth</dt>
                  <dd>{Math.round(selectedField.growthPercent)}%</dd>
                </div>
              </>
            )}
          </dl>
        ) : (
          <p className="game-hud__hint">Click a field on the map to select it.</p>
        )}
      </section>

      <section className="game-hud__panel">
        <h2 className="game-hud__section-title">Actions</h2>
        {isAvailableField ? (
          <>
            <div className="game-hud__actions">
              <button
                type="button"
                className="game-hud__button game-hud__button--primary"
                disabled={!canPurchase}
                onClick={() => game.purchaseSelectedField()}
              >
                Purchase
              </button>
              <button
                type="button"
                className="game-hud__button"
                disabled={!canLease}
                onClick={() => game.leaseSelectedField()}
              >
                Lease
              </button>
              <button
                type="button"
                className="game-hud__button"
                onClick={() => game.cancelFieldExpansion()}
              >
                Cancel
              </button>
            </div>
            {!canPurchase && !canLease ? (
              <p className="game-hud__hint">
                Earn money from your fields to purchase or lease this plot.
              </p>
            ) : null}
          </>
        ) : (
          <>
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
                disabled={!canChooseCrop || !canAffordAnyCrop}
                onClick={() => setCropDialogOpen(true)}
              >
                Choose Crop
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
            {selectedField?.state === States.Plowed && !canAffordAnyCrop ? (
              <p className="game-hud__hint">
                Earn more money to afford crop seeds.
              </p>
            ) : null}
            {tractorBusy ? (
              <p className="game-hud__hint">
                Tractor is busy — wait for the current job.
              </p>
            ) : null}
            {selectedField && !fieldUsable ? (
              <p className="game-hud__hint">
                This field must be purchased or leased before cultivation.
              </p>
            ) : null}
          </>
        )}
      </section>

      <section className="game-hud__panel">
        <h2 className="game-hud__section-title">Save Game</h2>
        <div className="game-hud__actions game-hud__actions--row">
          <button
            type="button"
            className="game-hud__button"
            onClick={() => game.saveGame()}
          >
            Save
          </button>
          <button
            type="button"
            className="game-hud__button game-hud__button--danger"
            onClick={() => setConfirmReset(true)}
          >
            Reset farm
          </button>
        </div>
        {confirmReset ? (
          <div className="game-hud__confirm">
            <p className="game-hud__hint">
              Reset money, fields, and progress to a fresh farm?
            </p>
            <div className="game-hud__confirm-actions">
              <button
                type="button"
                className="game-hud__button game-hud__button--danger"
                onClick={() => {
                  game.resetFarm()
                  setConfirmReset(false)
                }}
              >
                Confirm reset
              </button>
              <button
                type="button"
                className="game-hud__button"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="game-hud__hint">Progress auto-saves after farm changes.</p>
        )}
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
                {field.name}: {formatFieldOwnership(field.ownership)}
                {field.usable
                  ? field.cropName
                    ? ` — ${field.cropName} (${formatFieldState(field.state)}, ${Math.round(field.growthPercent)}%)`
                    : ` — ${formatFieldState(field.state)} (${Math.round(field.growthPercent)}%)`
                  : ''}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {cropDialogOpen ? (
        <ChooseCropDialog
          crops={snapshot.crops}
          money={snapshot.money}
          onSelect={(cropId) => {
            game.plantSelectedField(cropId)
            setCropDialogOpen(false)
          }}
          onCancel={() => setCropDialogOpen(false)}
        />
      ) : null}
    </aside>
  )
}
