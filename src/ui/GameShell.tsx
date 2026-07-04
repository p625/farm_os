import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Game } from '@core/Game.ts'
import { EMPTY_GAME_SNAPSHOT } from '@core/GameSnapshot.ts'
import { GameHUD } from './GameHUD.tsx'
import './GameShell.css'

export function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [game, setGame] = useState<Game | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const preventContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }
    canvas.addEventListener('contextmenu', preventContextMenu)

    let active = true
    const gameInstance = new Game(canvas)

    void gameInstance.start().then(() => {
      if (active) {
        setGame(gameInstance)
      } else {
        gameInstance.dispose()
      }
    })

    return () => {
      active = false
      canvas.removeEventListener('contextmenu', preventContextMenu)
      gameInstance.dispose()
      setGame(null)
    }
  }, [])

  const snapshot = useSyncExternalStore(
    (listener) => {
      if (!game) {
        return () => undefined
      }
      return game.subscribe(listener)
    },
    () => game?.getSnapshot() ?? EMPTY_GAME_SNAPSHOT,
    () => EMPTY_GAME_SNAPSHOT,
  )

  return (
    <div className="game-shell">
      <canvas ref={canvasRef} className="game-shell__canvas" />
      {game ? <GameHUD game={game} snapshot={snapshot} /> : null}
    </div>
  )
}
