import {
  AttachmentRadialActionKind,
  type AttachmentContextMenuSnapshot,
} from '@/types/attachment.ts'
import './RadialContextMenu.css'

interface AttachmentRadialMenuProps {
  menu: AttachmentContextMenuSnapshot
  onAction: (action: AttachmentRadialActionKind) => void
  onDismiss: () => void
}

const ACTION_LABELS: Record<AttachmentRadialActionKind, string> = {
  [AttachmentRadialActionKind.Attach]: 'Připojit',
  [AttachmentRadialActionKind.Detach]: 'Odpojit',
  [AttachmentRadialActionKind.Cancel]: 'Zrušit',
}

const MENU_RADIUS_PX = 72

export function AttachmentRadialMenu({
  menu,
  onAction,
  onDismiss,
}: AttachmentRadialMenuProps) {
  const actionCount = menu.actions.length
  const startAngle = -Math.PI / 2

  return (
    <div
      className="radial-context-menu"
      role="menu"
      aria-label="Akce s nářadím"
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
        const isCancel = action === AttachmentRadialActionKind.Cancel

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
            {ACTION_LABELS[action]}
          </button>
        )
      })}
    </div>
  )
}
