import type { FieldWorkModeMenuSnapshot } from '@/types/machine.ts'
import { FieldWorkModeActionKind } from '@/types/machine.ts'
import './RadialContextMenu.css'

interface FieldWorkModeRadialMenuProps {
  menu: FieldWorkModeMenuSnapshot
  taskLabel: string
  onDismiss: () => void
  onPerformManually: () => void
  onGpsThisField: () => void
  onGpsSelectedFields: () => void
  onGpsEntireBlock: () => void
}

const ACTION_LABELS: Record<FieldWorkModeActionKind, string> = {
  [FieldWorkModeActionKind.PerformManually]: 'Perform Manually',
  [FieldWorkModeActionKind.GpsThisField]: 'This field (GPS)',
  [FieldWorkModeActionKind.GpsSelectedFields]: 'Selected fields (GPS)',
  [FieldWorkModeActionKind.GpsEntireBlock]: 'Entire Block (GPS)',
  [FieldWorkModeActionKind.Cancel]: 'Cancel',
}

const MENU_RADIUS_PX = 72

export function FieldWorkModeRadialMenu({
  menu,
  taskLabel,
  onDismiss,
  onPerformManually,
  onGpsThisField,
  onGpsSelectedFields,
  onGpsEntireBlock,
}: FieldWorkModeRadialMenuProps) {
  const actionCount = menu.actions.length
  const startAngle = -Math.PI / 2

  return (
    <div
      className="radial-context-menu"
      role="menu"
      aria-label={`${taskLabel} mode`}
      style={{
        left: menu.screenX,
        top: menu.screenY,
      }}
    >
      <button
        type="button"
        className="radial-context-menu__backdrop"
        aria-label="Dismiss menu"
        onClick={onDismiss}
      />
      <div className="radial-context-menu__hub" aria-hidden="true" />
      <span className="radial-context-menu__task-label">{taskLabel}</span>
      {menu.actions.map((action, index) => {
        const angle =
          actionCount === 1
            ? startAngle
            : startAngle + (index / actionCount) * Math.PI * 2
        const x = Math.cos(angle) * MENU_RADIUS_PX
        const y = Math.sin(angle) * MENU_RADIUS_PX
        const isCancel = action === FieldWorkModeActionKind.Cancel

        return (
          <button
            key={action}
            type="button"
            role="menuitem"
            className={
              isCancel
                ? 'radial-context-menu__action radial-context-menu__action--cancel'
                : 'radial-context-menu__action'
            }
            style={{
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            }}
            onClick={() => {
              switch (action) {
                case FieldWorkModeActionKind.PerformManually:
                  onPerformManually()
                  break
                case FieldWorkModeActionKind.GpsThisField:
                  onGpsThisField()
                  break
                case FieldWorkModeActionKind.GpsSelectedFields:
                  onGpsSelectedFields()
                  break
                case FieldWorkModeActionKind.GpsEntireBlock:
                  onGpsEntireBlock()
                  break
                case FieldWorkModeActionKind.Cancel:
                  onDismiss()
                  break
              }
            }}
          >
            {ACTION_LABELS[action]}
          </button>
        )
      })}
    </div>
  )
}
