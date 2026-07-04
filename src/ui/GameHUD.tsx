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
import {
  formatMachineCapability,
  getFieldWorkRequirementHint,
} from '@/config/attachment-capabilities.ts'
import { MachineCapability } from '@/types/machine.ts'
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
  const [storageTab, setStorageTab] = useState<'raw' | 'processed'>('raw')
  const selectedField = snapshot.fields.find(
    (field) => field.id === snapshot.selectedFieldId,
  )

  const machineBusy = snapshot.selectedMachine.state !== TractorState.Idle
  const fieldUsable = selectedField?.usable ?? false
  const isAvailableField =
    selectedField?.ownership === FieldOwnership.Available

  const hasPlowCapability = snapshot.effectiveCapabilities.includes(
    MachineCapability.Plow,
  )
  const hasSeedCapability = snapshot.effectiveCapabilities.includes(
    MachineCapability.Seed,
  )

  const canPlow =
    !machineBusy &&
    fieldUsable &&
    selectedField?.state === States.Grass &&
    hasPlowCapability
  const canChooseCrop =
    !machineBusy &&
    fieldUsable &&
    selectedField?.state === States.Plowed &&
    hasSeedCapability
  const canAffordAnyCrop = snapshot.crops.some(
    (crop) => snapshot.money >= crop.seedCost,
  )

  const fieldWorkHint =
    selectedField && fieldUsable && !machineBusy
      ? getFieldWorkRequirementHint(
          selectedField.state,
          snapshot.effectiveCapabilities,
          {
            cropId: selectedField.cropId,
            harvestIncompatibilityMessage: snapshot.harvestCompatibilityHint,
          },
        )
      : null

  const canPurchase =
    isAvailableField &&
    selectedField !== undefined &&
    snapshot.money >= selectedField.purchasePrice
  const canLease =
    isAvailableField &&
    selectedField !== undefined &&
    snapshot.money >= selectedField.leasePrice

  const activeJob = snapshot.selectedMachine.activeJob

  return (
    <aside className="game-hud">
      <header className="game-hud__header">
        <h1 className="game-hud__title">FarmOS</h1>
        <p className="game-hud__subtitle">Phase 12D — Trailer Logistics</p>
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
        <h2 className="game-hud__section-title">
          {snapshot.machineAttachments?.machineName ?? 'Machine'}
        </h2>
        <dl className="game-hud__stats">
          <div className="game-hud__stat">
            <dt>Selection</dt>
            <dd>
              {snapshot.selectedEntity.kind === 'machine'
                ? `${snapshot.machineAttachments?.machineName ?? 'Machine'} selected`
                : snapshot.selectedEntity.kind === 'field'
                  ? 'Field selected'
                  : 'None'}
            </dd>
          </div>
          <div className="game-hud__stat">
            <dt>State</dt>
            <dd>{formatTractorState(snapshot.selectedMachine.state)}</dd>
          </div>
          <div className="game-hud__stat">
            <dt>Capabilities</dt>
            <dd>
              {snapshot.effectiveCapabilities.length > 0
                ? snapshot.effectiveCapabilities
                    .map((capability) => formatMachineCapability(capability))
                    .join(', ')
                : 'None'}
            </dd>
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
              {snapshot.selectedMachine.state === TractorState.Working ? (
                <div className="game-hud__stat">
                  <dt>Work</dt>
                  <dd>{Math.round(snapshot.selectedMachine.workProgress * 100)}%</dd>
                </div>
              ) : null}
            </>
        ) : (
          <p className="game-hud__hint">
            {snapshot.selectedEntity.kind === 'machine'
              ? 'Right-click terrain to move. Right-click a field to open work actions.'
              : 'Click a machine to select it for manual movement.'}
          </p>
        )}
        </dl>
        {snapshot.selectedMachine.state === TractorState.Working ? (
          <div className="game-hud__progress">
            <div
              className="game-hud__progress-fill"
              style={{ width: `${snapshot.selectedMachine.workProgress * 100}%` }}
            />
          </div>
        ) : null}
          {snapshot.machineAttachments ? (
          <dl className="game-hud__stats game-hud__stats--attachments">
            <div className="game-hud__stat">
              <dt>Header</dt>
              <dd>
                {snapshot.machineAttachments.slots.find(
                  (slot) => slot.slotId === 'header_slot',
                )?.attachmentName ??
                  snapshot.machineAttachments.slots.find(
                    (slot) => slot.slotId === 'rear_hitch',
                  )?.attachmentName ??
                  'Empty'}
              </dd>
            </div>
            {snapshot.headerSupportedCrops.length > 0 ? (
              <div className="game-hud__stat">
                <dt>Supported crops</dt>
                <dd>{snapshot.headerSupportedCrops.join(', ')}</dd>
              </div>
            ) : null}
            {snapshot.selectedMachine.grainBin ? (
              <>
                <div className="game-hud__stat">
                  <dt>Grain bin</dt>
                  <dd>
                    {snapshot.selectedMachine.grainBin.hasCargo
                      ? `${Math.round(snapshot.selectedMachine.grainBin.fillPercent * 100)}%${snapshot.selectedMachine.grainBin.cropName ? ` ${snapshot.selectedMachine.grainBin.cropName}` : ''}`
                      : 'Empty'}
                    {snapshot.selectedMachine.grainBin.isFull ? ' (Full)' : ''}
                  </dd>
                </div>
              </>
            ) : null}
            {snapshot.trailerCargo ? (
              <div className="game-hud__stat">
                <dt>Trailer</dt>
                <dd>
                  {snapshot.trailerCargo.hasCargo
                    ? `${Math.round(snapshot.trailerCargo.fillPercent * 100)}%${snapshot.trailerCargo.cropName ? ` ${snapshot.trailerCargo.cropName}` : ''}`
                    : 'Empty'}
                  {snapshot.trailerCargo.isFull ? ' (Full)' : ''}
                </dd>
              </div>
            ) : (
              <div className="game-hud__stat">
                <dt>Trailer hitch</dt>
                <dd>
                  {snapshot.machineAttachments.slots.find(
                    (slot) => slot.slotId === 'trailer_hitch',
                  )?.attachmentName ?? 'Empty'}
                </dd>
              </div>
            )}
          </dl>
        ) : null}
        {!activeJob && snapshot.selectedEntity.kind === 'machine' ? (
          <p className="game-hud__hint">
            Right-click equipment in the yard to attach or detach.
          </p>
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
            </div>
            <p className="game-hud__hint game-hud__hint--primary">
              Select a machine, then right-click a field to work it.
            </p>
            {fieldWorkHint ? (
              <p className="game-hud__hint">{fieldWorkHint}</p>
            ) : null}
            {snapshot.logisticsHint ? (
              <p className="game-hud__hint">{snapshot.logisticsHint}</p>
            ) : null}
            {selectedField?.state === States.Plowed && !canAffordAnyCrop ? (
              <p className="game-hud__hint">
                Earn more money to afford crop seeds.
              </p>
            ) : null}
            {machineBusy ? (
              <p className="game-hud__hint">
                Machine is busy — wait for the current job.
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
        <h2 className="game-hud__section-title">Farm Shop</h2>
        <ul className="game-hud__shop-list">
          {snapshot.shopUpgrades.map((upgrade) => (
            <li key={upgrade.id} className="game-hud__shop-item">
              <div className="game-hud__shop-details">
                <span className="game-hud__shop-name">
                  {upgrade.name}{' '}
                  <span className="game-hud__shop-level">
                    Lv {upgrade.level}/{upgrade.maxLevel}
                  </span>
                </span>
                <span className="game-hud__shop-description">
                  {upgrade.description}
                </span>
                <span className="game-hud__shop-effect">
                  {upgrade.effectSummary}
                </span>
              </div>
              {upgrade.isMaxed ? (
                <span className="game-hud__shop-maxed">Maxed</span>
              ) : (
                <button
                  type="button"
                  className="game-hud__button game-hud__button--shop"
                  disabled={!upgrade.canAfford}
                  onClick={() => game.purchaseUpgrade(upgrade.id)}
                >
                  Buy ₡{upgrade.nextPrice?.toLocaleString()}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="game-hud__panel">
        <h2 className="game-hud__section-title">Market Prices</h2>
        <ul className="game-hud__market-list">
          {snapshot.marketPrices.map((price) => (
            <li key={price.cropId} className="game-hud__market-item">
              <span
                className="game-hud__crop-swatch"
                style={{ backgroundColor: price.displayColor }}
              />
              <span className="game-hud__market-name">{price.cropName}</span>
              <span className="game-hud__market-price">
                ₡{price.currentPrice}/unit
              </span>
              <span className="game-hud__market-base">
                base ₡{price.basePrice}
              </span>
            </li>
          ))}
        </ul>
        <p className="game-hud__hint">Prices update once per game day.</p>
      </section>

      <section className="game-hud__panel">
        <h2 className="game-hud__section-title">Storage</h2>
        <div className="game-hud__tabs">
          <button
            type="button"
            className={
              storageTab === 'raw'
                ? 'game-hud__tab game-hud__tab--active'
                : 'game-hud__tab'
            }
            onClick={() => setStorageTab('raw')}
          >
            Raw Materials
          </button>
          <button
            type="button"
            className={
              storageTab === 'processed'
                ? 'game-hud__tab game-hud__tab--active'
                : 'game-hud__tab'
            }
            onClick={() => setStorageTab('processed')}
          >
            Processed Goods
          </button>
        </div>

        {storageTab === 'raw' ? (
          snapshot.inventory.length > 0 ? (
            <ul className="game-hud__inventory-list">
              {snapshot.inventory.map((item) => {
                const marketPrice = snapshot.marketPrices.find(
                  (price) => price.cropId === item.cropId,
                )
                const unitPrice = marketPrice?.currentPrice ?? 0
                const totalValue = item.quantity * unitPrice

                return (
                  <li key={item.cropId} className="game-hud__inventory-item">
                    <div className="game-hud__inventory-details">
                      <span
                        className="game-hud__crop-swatch"
                        style={{ backgroundColor: item.displayColor }}
                      />
                      <span>
                        {item.quantity} {item.cropName}
                      </span>
                      <span className="game-hud__inventory-value">
                        ₡{totalValue.toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="game-hud__button game-hud__button--sell"
                      onClick={() => game.sellStoredCrop(item.cropId)}
                    >
                      Sell
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="game-hud__hint">
              Harvested crops are stored here until sold or milled.
            </p>
          )
        ) : (
          <>
            <div className="game-hud__mill-panel">
              <div className="game-hud__mill-header">
                <span className="game-hud__mill-name">{snapshot.mill.name}</span>
                <span className="game-hud__mill-recipe">
                  {snapshot.mill.recipeLabel}
                </span>
              </div>

              {snapshot.mill.state === 'processing' ? (
                <div className="game-hud__mill-progress">
                  <div
                    className="game-hud__mill-progress-fill"
                    style={{
                      width: `${Math.round(snapshot.mill.progress * 100)}%`,
                    }}
                  />
                </div>
              ) : null}

              <div className="game-hud__mill-actions">
                <button
                  type="button"
                  className="game-hud__button"
                  disabled={!snapshot.mill.canStart}
                  onClick={() => game.startMilling()}
                >
                  Start Milling
                </button>
                <button
                  type="button"
                  className="game-hud__button game-hud__button--primary"
                  disabled={!snapshot.mill.canCollect}
                  onClick={() => game.collectFlour()}
                >
                  Collect Flour
                </button>
              </div>

              {snapshot.mill.state === 'processing' ? (
                <p className="game-hud__hint">
                  Milling in progress — {Math.round(snapshot.mill.progress * 100)}
                  %
                </p>
              ) : null}
            </div>

            {snapshot.processedInventory.length > 0 ? (
              <ul className="game-hud__inventory-list">
                {snapshot.processedInventory.map((item) => (
                  <li key={item.productId} className="game-hud__inventory-item">
                    <div className="game-hud__inventory-details">
                      <span
                        className="game-hud__crop-swatch"
                        style={{ backgroundColor: item.displayColor }}
                      />
                      <span>
                        {item.quantity} {item.productName}
                      </span>
                      <span className="game-hud__inventory-value">
                        ₡{item.totalValue.toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="game-hud__button game-hud__button--sell"
                      onClick={() => game.sellProcessedProduct(item.productId)}
                    >
                      Sell
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="game-hud__hint">
                Collect flour from the mill to store processed goods here.
              </p>
            )}

            {snapshot.processedMarketPrices.length > 0 ? (
              <ul className="game-hud__processed-prices">
                {snapshot.processedMarketPrices.map((price) => (
                  <li key={price.productId}>
                    {price.productName}: ₡{price.currentPrice}/unit (base ₡
                    {price.basePrice})
                  </li>
                ))}
              </ul>
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
