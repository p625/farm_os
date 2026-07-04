import { useEffect, useState } from 'react'
import { GameShell } from '@ui/GameShell.tsx'
import { MainMenuScreen } from '@ui/menu/MainMenuScreen.tsx'
import { StudioShell } from '@/studio/StudioShell.tsx'
import { defaultMapPackageRegistry } from '@/maps/MapPackageLoader.ts'
import { loadExportedMapsIntoRegistry } from '@/maps/ExportedMapStorage.ts'
import type { GameSessionConfig } from '@game/GameSession.ts'

loadExportedMapsIntoRegistry(defaultMapPackageRegistry)

export type AppMode = 'menu' | 'game' | 'studio'

function readInitialMode(): AppMode {
  if (typeof window === 'undefined') {
    return 'menu'
  }
  const params = new URLSearchParams(window.location.search)
  if (params.get('studio') === '1' || params.get('mode') === 'studio') {
    return 'studio'
  }
  if (params.get('game') === '1' || params.get('mode') === 'game') {
    return 'game'
  }
  return 'menu'
}

export function App() {
  const [mode, setMode] = useState<AppMode>(readInitialMode)
  const [session, setSession] = useState<GameSessionConfig | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F10') {
        event.preventDefault()
        setMode((current) => (current === 'studio' ? 'menu' : 'studio'))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (mode === 'studio') {
    return <StudioShell onSwitchToGame={() => setMode('menu')} />
  }

  if (mode === 'game' && session) {
    return (
      <GameShell
        session={session}
        onExit={() => {
          setSession(null)
          setMode('menu')
        }}
        onSwitchToStudio={() => setMode('studio')}
      />
    )
  }

  return (
    <MainMenuScreen
      onStartGame={(nextSession) => {
        setSession(nextSession)
        setMode('game')
      }}
      onOpenStudio={() => setMode('studio')}
    />
  )
}
