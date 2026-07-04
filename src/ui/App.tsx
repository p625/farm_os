import { useEffect, useState } from 'react'
import { GameShell } from '@ui/GameShell.tsx'
import { StudioShell } from '@/studio/StudioShell.tsx'

export type AppMode = 'game' | 'studio'

function readInitialMode(): AppMode {
  if (typeof window === 'undefined') {
    return 'game'
  }
  const params = new URLSearchParams(window.location.search)
  if (params.get('studio') === '1' || params.get('mode') === 'studio') {
    return 'studio'
  }
  return 'game'
}

export function App() {
  const [mode, setMode] = useState<AppMode>(readInitialMode)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F10') {
        event.preventDefault()
        setMode((current) => (current === 'game' ? 'studio' : 'game'))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (mode === 'studio') {
    return <StudioShell onSwitchToGame={() => setMode('game')} />
  }

  return (
    <GameShell
      onSwitchToStudio={() => setMode('studio')}
    />
  )
}
