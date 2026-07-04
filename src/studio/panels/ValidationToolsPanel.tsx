import type { MapValidationSeverity } from '@/types/map-validation.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'

interface ValidationToolsPanelProps {
  store: StudioStore
  onSceneRefresh: () => void
}

const SEVERITY_LABEL: Record<MapValidationSeverity, string> = {
  error: 'Error',
  warn: 'Warning',
  info: 'Note',
}

export function ValidationToolsPanel({
  store,
  onSceneRefresh,
}: ValidationToolsPanelProps) {
  const { activeModuleId, validationReport, validationFocusIssueId } =
    useStudioStore(store)

  if (activeModuleId !== 'validation') {
    return null
  }

  const report = validationReport
  const issues = report?.issues ?? []

  return (
    <div className="studio-panel studio-panel--validation">
      <h2 className="studio-panel__title">Validation</h2>
      <p className="studio-hint">
        Kontrola pravidel mapy dle art dokumentace — parcel overlap, bounds,
        metadata vrstev a Map 01 doporučení.
      </p>

      <div className="studio-validation-actions">
        <button
          type="button"
          className="studio-btn studio-btn--primary"
          onClick={() => {
            store.runMapValidation()
            onSceneRefresh()
          }}
        >
          Run validation
        </button>
      </div>

      {report ? (
        <div
          className={`studio-validation-summary${
            report.passed
              ? ' studio-validation-summary--pass'
              : report.errorCount > 0
                ? ' studio-validation-summary--fail'
                : ' studio-validation-summary--warn'
          }`}
        >
          <span>{report.errorCount} errors</span>
          <span>{report.warnCount} warnings</span>
          <span>{report.infoCount} notes</span>
        </div>
      ) : null}

      {report?.passed && issues.length === 0 ? (
        <p className="studio-hint studio-validation-pass">
          Mapa prošla všemi kontrolami bez nálezů.
        </p>
      ) : null}

      {report?.passed && issues.length > 0 ? (
        <p className="studio-hint studio-validation-pass">
          Žádné chyby — mapa je exportovatelná. Zkontroluj varování a poznámky.
        </p>
      ) : null}

      {issues.length > 0 ? (
        <>
          <h3 className="studio-panel__subtitle">Findings</h3>
          <div className="studio-validation-issue-list">
            {issues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                className={`studio-validation-issue studio-validation-issue--${issue.severity}${
                  validationFocusIssueId === issue.id
                    ? ' studio-validation-issue--focused'
                    : ''
                }`}
                onClick={() => {
                  store.focusValidationIssue(issue.id)
                  onSceneRefresh()
                }}
              >
                <span className="studio-validation-issue__severity">
                  {SEVERITY_LABEL[issue.severity]}
                </span>
                <span className="studio-validation-issue__message">
                  {issue.message}
                </span>
                {issue.objectId ? (
                  <span className="studio-validation-issue__meta studio-kv__mono">
                    {issue.objectId}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : report ? null : (
        <p className="studio-hint">Spusť validaci pro kontrolu aktuální mapy.</p>
      )}
    </div>
  )
}
