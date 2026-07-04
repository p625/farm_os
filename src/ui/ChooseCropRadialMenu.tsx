import type { CropSnapshot } from '@/types/crop.ts'
import './ChooseCropRadialMenu.css'

interface ChooseCropRadialMenuProps {
  screenX: number
  screenY: number
  crops: readonly CropSnapshot[]
  money: number
  onSelect: (cropId: string) => void
  onCancel: () => void
}

const CROP_RADIUS_PX = 88
const CANCEL_RADIUS_PX = 52

export function ChooseCropRadialMenu({
  screenX,
  screenY,
  crops,
  money,
  onSelect,
  onCancel,
}: ChooseCropRadialMenuProps) {
  const slotCount = crops.length + 1
  const startAngle = -Math.PI / 2

  return (
    <div
      className="choose-crop-radial"
      role="dialog"
      aria-label="Vyberte plodinu"
      style={{
        left: screenX,
        top: screenY,
      }}
    >
      <button
        type="button"
        className="choose-crop-radial__backdrop"
        aria-label="Zrušit výběr"
        onClick={onCancel}
      />
      <div className="choose-crop-radial__hub" aria-hidden="true" />
      {crops.map((crop, index) => {
        const angle = startAngle + (index / slotCount) * Math.PI * 2
        const x = Math.cos(angle) * CROP_RADIUS_PX
        const y = Math.sin(angle) * CROP_RADIUS_PX
        const affordable = money >= crop.seedCost

        return (
          <button
            key={crop.id}
            type="button"
            className={
              affordable
                ? 'choose-crop-radial__crop'
                : 'choose-crop-radial__crop choose-crop-radial__crop--disabled'
            }
            style={{
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            }}
            disabled={!affordable}
            title={`${crop.name} · semeno ₡${crop.seedCost.toLocaleString()}`}
            onClick={() => onSelect(crop.id)}
          >
            <span
              className="choose-crop-radial__swatch"
              style={{ backgroundColor: crop.displayColor }}
            />
            <span className="choose-crop-radial__name">{crop.name}</span>
            <span className="choose-crop-radial__cost">
              ₡{crop.seedCost.toLocaleString()}
            </span>
          </button>
        )
      })}
      <button
        type="button"
        className="choose-crop-radial__cancel"
        style={{
          transform: `translate(calc(-50% + ${Math.cos(startAngle + (crops.length / slotCount) * Math.PI * 2) * CANCEL_RADIUS_PX}px), calc(-50% + ${Math.sin(startAngle + (crops.length / slotCount) * Math.PI * 2) * CANCEL_RADIUS_PX}px))`,
        }}
        onClick={onCancel}
      >
        Zrušit
      </button>
    </div>
  )
}
