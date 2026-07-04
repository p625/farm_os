import { useEffect, useState } from 'react'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'
import { suggestStudioPackageId } from '@/studio/export/WorldMapExporter.ts'

interface ExportToolsPanelProps {
  store: StudioStore
}

export function ExportToolsPanel({ store }: ExportToolsPanelProps) {
  const { activeModuleId, validationReport, exportedMaps, map } = useStudioStore(store)
  const [exportName, setExportName] = useState(map.name)
  const [exportId, setExportId] = useState(() => suggestStudioPackageId(map))
  const [exportDescription, setExportDescription] = useState(
    map.meta.description ?? '',
  )
  const [confirmForceExport, setConfirmForceExport] = useState(false)

  useEffect(() => {
    if (activeModuleId !== 'export') {
      return
    }
    queueMicrotask(() => {
      setExportName(map.name)
      setExportId(suggestStudioPackageId(map))
      setExportDescription(map.meta.description ?? '')
      setConfirmForceExport(false)
    })
  }, [activeModuleId, map])

  if (activeModuleId !== 'export') {
    return null
  }

  const errorCount = validationReport?.errorCount ?? 0
  const warnCount = validationReport?.warnCount ?? 0
  const hasValidationErrors = errorCount > 0

  const runExport = (ignoreValidationErrors: boolean) => {
    const ok = store.exportMapToGame({
      ignoreValidationErrors,
      packageId: exportId,
      packageName: exportName,
      description: exportDescription,
    })
    if (ok) {
      setConfirmForceExport(false)
    }
  }

  return (
    <div className="studio-panel studio-panel--export">
      <h2 className="studio-panel__title">Export</h2>
      <p className="studio-hint">
        Export uloží mapu do prohlížeče a přidá ji do výběru při New Game.
        Oficiální <span className="studio-kv__mono">map_01</span> zůstává —
        export jde pod samostatným ID (typicky{' '}
        <span className="studio-kv__mono">map_01_studio</span>).
      </p>

      <label className="studio-field studio-field--wide">
        <span className="studio-field__label">Název ve hře</span>
        <input
          className="studio-input"
          type="text"
          maxLength={80}
          value={exportName}
          onChange={(event) => setExportName(event.target.value)}
        />
      </label>

      <label className="studio-field studio-field--wide">
        <span className="studio-field__label">ID balíčku ve hře</span>
        <input
          className="studio-input studio-kv__mono"
          type="text"
          maxLength={48}
          value={exportId}
          onChange={(event) => setExportId(event.target.value)}
        />
      </label>

      <label className="studio-field studio-field--wide">
        <span className="studio-field__label">Popis</span>
        <input
          className="studio-input"
          type="text"
          maxLength={160}
          value={exportDescription}
          onChange={(event) => setExportDescription(event.target.value)}
        />
      </label>

      <p className="studio-hint studio-kv__mono">
        Studio soubor: {map.id}
      </p>

      {validationReport ? (
        <div
          className={`studio-validation-summary${
            hasValidationErrors
              ? ' studio-validation-summary--fail'
              : warnCount > 0
                ? ' studio-validation-summary--warn'
                : ' studio-validation-summary--pass'
          }`}
        >
          <span>{errorCount} errors</span>
          <span>{warnCount} warnings</span>
          <span>{validationReport.infoCount} notes</span>
        </div>
      ) : (
        <p className="studio-hint">
          Spusť Validation pro přehled, nebo exportuj rovnou.
        </p>
      )}

      <div className="studio-export-actions">
        <button
          type="button"
          className="studio-btn"
          onClick={() => store.runMapValidation()}
        >
          Run validation
        </button>
        <button
          type="button"
          className="studio-btn studio-btn--primary"
          disabled={!exportName.trim() || !exportId.trim()}
          onClick={() => runExport(false)}
        >
          Export to game
        </button>
      </div>

      {hasValidationErrors ? (
        <div className="studio-export-force">
          <p className="studio-hint studio-validation-summary--fail">
            {errorCount} validation error(s) — export může rozbít hru, ale můžeš
            pokračovat vědomě.
          </p>
          {!confirmForceExport ? (
            <button
              type="button"
              className="studio-btn studio-btn--danger"
              onClick={() => setConfirmForceExport(true)}
            >
              Export anyway…
            </button>
          ) : (
            <div className="studio-road-actions">
              <button
                type="button"
                className="studio-btn studio-btn--danger"
                onClick={() => runExport(true)}
              >
                Confirm export with errors
              </button>
              <button
                type="button"
                className="studio-btn"
                onClick={() => setConfirmForceExport(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : null}

      <h3 className="studio-panel__subtitle">Exported maps</h3>
      {exportedMaps.length === 0 ? (
        <p className="studio-hint">Zatím žádné exportované mapy.</p>
      ) : (
        <ul className="studio-export-list">
          {exportedMaps.map((entry) => (
            <li key={entry.id} className="studio-export-list__item">
              <div>
                <strong>{entry.name}</strong>
                <span className="studio-export-list__meta studio-kv__mono">
                  {entry.id}
                </span>
                <span className="studio-export-list__meta">
                  {entry.fieldCount} fields · v{entry.version}
                </span>
              </div>
              <button
                type="button"
                className="studio-btn studio-btn--danger"
                onClick={() => store.deleteExportedMap(entry.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
