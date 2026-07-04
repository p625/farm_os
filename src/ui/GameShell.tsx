import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Game } from '@core/Game.ts'
import { EMPTY_GAME_SNAPSHOT } from '@core/GameSnapshot.ts'
import { FieldRadialActionKind } from '@/types/machine.ts'
import { GameHUD } from './GameHUD.tsx'
import { ChooseCropDialog } from './ChooseCropDialog.tsx'
import { RadialContextMenu } from './RadialContextMenu.tsx'
import './GameShell.css'

export function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [game, setGame] = useState<Game | null>(null)
  const [pendingSeedFieldId, setPendingSeedFieldId] = useState<string | null>(
    null,
  )

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
      {game && snapshot.fieldContextMenu ? (
        <RadialContextMenu
          menu={snapshot.fieldContextMenu}
          onDismiss={() => game.closeFieldContextMenu()}
          onAction={(action) => {
            const fieldId = snapshot.fieldContextMenu!.fieldId
            switch (action) {
              case FieldRadialActionKind.Plow:
                game.plowField(fieldId)
                break
              case FieldRadialActionKind.Seed:
                game.closeFieldContextMenu()
                setPendingSeedFieldId(fieldId)
                break
              case FieldRadialActionKind.Harvest:
                game.harvestField(fieldId)
                break
              case FieldRadialActionKind.Cancel:
                game.closeFieldContextMenu()
                break
            }
          }}
        />
      ) : null}
      {game && pendingSeedFieldId ? (
        <ChooseCropDialog
          crops={snapshot.crops}
          money={snapshot.money}
          onSelect={(cropId) => {
            game.plantField(pendingSeedFieldId, cropId)
            setPendingSeedFieldId(null)
          }}
          onCancel={() => setPendingSeedFieldId(null)}
        />
      ) : null}
    </div>
  )
}
