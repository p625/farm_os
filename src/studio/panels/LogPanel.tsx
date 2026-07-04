import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { useStudioStore } from '@/studio/hooks/useStudioStore.ts'

interface LogPanelProps {
  store: StudioStore
}

export function LogPanel({ store }: LogPanelProps) {
  const { logs } = useStudioStore(store)

  return (
    <div className="studio-log">
      <div className="studio-log__header">Log</div>
      <div className="studio-log__body">
        {logs.length === 0 ? (
          <span className="studio-log__empty">No messages yet.</span>
        ) : (
          logs.map((entry) => (
            <div
              key={entry.id}
              className={`studio-log__line studio-log__line--${entry.level}`}
            >
              <span className="studio-log__time">{entry.timestamp}</span>
              <span className="studio-log__msg">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
