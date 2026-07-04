import {
  MachineRadialActionKind,
  type MachineContextMenuSnapshot,
} from '@/types/machine.ts'
import './RadialContextMenu.css'

interface MachineRadialMenuProps {
  menu: MachineContextMenuSnapshot
  onAction: (action: MachineRadialActionKind) => void
  onDismiss: () => void
}

const ACTION_LABELS: Record<MachineRadialActionKind, string> = {
  [MachineRadialActionKind.LoadFromCombine]: 'Naložit',
  [MachineRadialActionKind.Cancel]: 'Zrušit',
}

const MENU_RADIUS_PX = 72

export function MachineRadialMenu({
  menu,
  onAction,
  onDismiss,
}: MachineRadialMenuProps) {
  const actionCount = menu.actions.length
  const startAngle = -Math.PI / 2

  return (
    <div
      className="radial-context-menu"
      role="menu"
      aria-label="Machine actions"
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
      {menu.actions.map((action, index) => {
        const angle =
          actionCount === 1
            ? startAngle
            : startAngle + (index / actionCount) * Math.PI * 2
        const x = Math.cos(angle) * MENU_RADIUS_PX
        const y = Math.sin(angle) * MENU_RADIUS_PX
        const isCancel = action === MachineRadialActionKind.Cancel

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
            onClick={() => onAction(action)}
          >
            {action === MachineRadialActionKind.LoadFromCombine
              ? menu.loadActionLabel
              : ACTION_LABELS[action]}
          </button>
        )
      })}
    </div>
  )
}
