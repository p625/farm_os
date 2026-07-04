import type { FleetMachineSnapshot } from '@/types/machine-fleet.ts'
import {
  getFleetHeadlineLabel,
  getFleetReadyStatusLabel,
  isGpsAutomationActive,
} from '@/types/machine-fleet.ts'
import {
  MachineTemplateId,
  type MachineTemplateId as MachineTemplateIdValue,
} from '@/types/machine-template.ts'
import { formatJobType } from '@systems/TractorJobSystem.ts'

interface FleetMachineCardProps {
  machine: FleetMachineSnapshot
  onSelect: () => void
  onCancelGps?: () => void
}

function getFleetMachineIcon(templateId: MachineTemplateIdValue): string {
  switch (templateId) {
    case MachineTemplateId.SmallTractor:
      return '🚜'
    case MachineTemplateId.GrainCombine:
      return '🌾'
    case MachineTemplateId.CornCombine:
      return '🌽'
    default:
      return '🚜'
  }
}

function formatFillPercent(fill: { fillPercent: number } | null): string | null {
  if (!fill) {
    return null
  }
  return `${Math.round(fill.fillPercent * 100)}%`
}

export function FleetMachineCard({
  machine,
  onSelect,
  onCancelGps,
}: FleetMachineCardProps) {
  const icon = getFleetMachineIcon(machine.templateId)
  const headline = getFleetHeadlineLabel(
    machine.status,
    machine.activeJob,
    machine.commandOwner,
  )
  const grainBinLabel = formatFillPercent(machine.grainBin)
  const trailerFillLabel = formatFillPercent(machine.trailerFill)
  const workProgressLabel =
    machine.workProgress > 0
      ? `${Math.round(machine.workProgress * 100)}%`
      : null
  const jobLabel = machine.activeJob
    ? formatJobType(machine.activeJob.type)
    : null
  const showWorkProgress =
    machine.workProgress > 0 &&
    (machine.status === 'working' ||
      machine.status === 'loading' ||
      machine.status === 'unloading')

  const showCancelGps =
    onCancelGps !== undefined &&
    isGpsAutomationActive(machine.commandOwner, machine.status)

  return (
    <button
      type="button"
      className={
        machine.selected
          ? 'fleet-machine-card fleet-machine-card--selected'
          : 'fleet-machine-card'
      }
      onClick={onSelect}
      aria-pressed={machine.selected}
    >
      <header className="fleet-machine-card__header">
        <span className="fleet-machine-card__icon" aria-hidden>
          {icon}
        </span>
        <div className="fleet-machine-card__titles">
          <h3 className="fleet-machine-card__name">{machine.displayName}</h3>
          <p className="fleet-machine-card__headline">{headline}</p>
        </div>
      </header>

      <dl className="fleet-machine-card__details">
        <div className="fleet-machine-card__row">
          <dt>Template</dt>
          <dd>{machine.templateName}</dd>
        </div>
        <div className="fleet-machine-card__row">
          <dt>Location</dt>
          <dd>{machine.fieldName ?? '—'}</dd>
        </div>
        {machine.destinationLabel ? (
          <div className="fleet-machine-card__row">
            <dt>Destination</dt>
            <dd>{machine.destinationLabel}</dd>
          </div>
        ) : null}
        {machine.attachmentNames.length > 0 ? (
          <div className="fleet-machine-card__row">
            <dt>Attachment</dt>
            <dd>{machine.attachmentNames.join(', ')}</dd>
          </div>
        ) : null}
        {grainBinLabel ? (
          <div className="fleet-machine-card__row">
            <dt>Bin</dt>
            <dd>{grainBinLabel}</dd>
          </div>
        ) : null}
        {trailerFillLabel ? (
          <div className="fleet-machine-card__row">
            <dt>Trailer</dt>
            <dd>
              {trailerFillLabel}
              {machine.trailerFill?.cropName
                ? ` ${machine.trailerFill.cropName}`
                : ''}
            </dd>
          </div>
        ) : null}
        {showWorkProgress && workProgressLabel ? (
          <div className="fleet-machine-card__row">
            <dt>Work</dt>
            <dd>{workProgressLabel}</dd>
          </div>
        ) : null}
        {machine.logisticsLabel ? (
          <div className="fleet-machine-card__row">
            <dt>Logistics</dt>
            <dd>{machine.logisticsLabel}</dd>
          </div>
        ) : null}
        {jobLabel && machine.status === 'working' ? (
          <div className="fleet-machine-card__row">
            <dt>Task</dt>
            <dd>{jobLabel}</dd>
          </div>
        ) : null}
        {machine.workOrder ? (
          <div className="fleet-machine-card__row">
            <dt>Work order</dt>
            <dd>{machine.workOrder.displayName}</dd>
          </div>
        ) : null}
        {machine.workOrder?.blockId ? (
          <div className="fleet-machine-card__row">
            <dt>Block</dt>
            <dd>Block {machine.workOrder.blockId}</dd>
          </div>
        ) : null}
        {machine.workOrder ? (
          <div className="fleet-machine-card__row">
            <dt>Remaining</dt>
            <dd>
              {machine.workOrder.remainingFieldCount}/
              {machine.workOrder.totalFieldCount} fields (
              {machine.workOrder.remainingArea} ha left)
            </dd>
          </div>
        ) : null}
        {machine.workOrder?.currentFieldName ? (
          <div className="fleet-machine-card__row">
            <dt>Current field</dt>
            <dd>{machine.workOrder.currentFieldName}</dd>
          </div>
        ) : null}
        <div className="fleet-machine-card__row">
          <dt>Fuel</dt>
          <dd>{machine.fuelLabel}</dd>
        </div>
        <div className="fleet-machine-card__row">
          <dt>Status</dt>
          <dd>{getFleetReadyStatusLabel(machine.status, machine.commandOwner)}</dd>
        </div>
      </dl>
      {showCancelGps ? (
        <button
          type="button"
          className="fleet-machine-card__cancel game-hud__button game-hud__button--danger"
          onClick={(event) => {
            event.stopPropagation()
            onCancelGps?.()
          }}
        >
          Cancel work order
        </button>
      ) : null}
    </button>
  )
}
