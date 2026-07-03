import type { CropSnapshot } from '@/types/crop.ts'
import './ChooseCropDialog.css'

interface ChooseCropDialogProps {
  crops: readonly CropSnapshot[]
  money: number
  onSelect: (cropId: string) => void
  onCancel: () => void
}

export function ChooseCropDialog({
  crops,
  money,
  onSelect,
  onCancel,
}: ChooseCropDialogProps) {
  return (
    <div className="choose-crop-dialog" role="dialog" aria-label="Choose crop">
      <div className="choose-crop-dialog__backdrop" onClick={onCancel} />
      <div className="choose-crop-dialog__panel">
        <header className="choose-crop-dialog__header">
          <h3 className="choose-crop-dialog__title">Choose Crop</h3>
          <p className="choose-crop-dialog__subtitle">
            Select what to plant on this field.
          </p>
        </header>

        <ul className="choose-crop-dialog__list">
          {crops.map((crop) => {
            const affordable = money >= crop.seedCost
            return (
              <li key={crop.id}>
                <button
                  type="button"
                  className="choose-crop-dialog__option"
                  disabled={!affordable}
                  onClick={() => onSelect(crop.id)}
                >
                  <span
                    className="choose-crop-dialog__swatch"
                    style={{ backgroundColor: crop.displayColor }}
                  />
                  <span className="choose-crop-dialog__details">
                    <span className="choose-crop-dialog__name">{crop.name}</span>
                    <span className="choose-crop-dialog__meta">
                      {crop.growingDays} days · yield {crop.yield} · ₡
                      {crop.sellingPrice}/unit
                    </span>
                    <span className="choose-crop-dialog__economics">
                      Seed ₡{crop.seedCost.toLocaleString()} · harvest ₡
                      {crop.harvestValue.toLocaleString()} · profit ₡
                      {crop.profitEstimate.toLocaleString()}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <footer className="choose-crop-dialog__footer">
          <button
            type="button"
            className="choose-crop-dialog__cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  )
}
