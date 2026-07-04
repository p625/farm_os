import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Game } from '@core/Game.ts'
import { EMPTY_GAME_SNAPSHOT } from '@core/GameSnapshot.ts'
import { FieldRadialActionKind } from '@/types/machine.ts'
import { clampRadialAnchor } from '@/utils/radial-menu-position.ts'
import { GameHUD } from './GameHUD.tsx'
import { ChooseCropRadialMenu } from './ChooseCropRadialMenu.tsx'
import { RadialContextMenu } from './RadialContextMenu.tsx'
import { AttachmentRadialMenu } from './AttachmentRadialMenu.tsx'
import { AttachmentRadialActionKind } from '@/types/attachment.ts'
import './GameShell.css'

export function GameShell() {
  const shellRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [game, setGame] = useState<Game | null>(null)
  const [pendingSeed, setPendingSeed] = useState<{
    fieldId: string
    screenX: number
    screenY: number
  } | null>(null)

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) {
      return
    }

    const preventContextMenu = (event: Event) => {
      event.preventDefault()
    }

    shell.addEventListener('contextmenu', preventContextMenu, { capture: true })

    return () => {
      shell.removeEventListener('contextmenu', preventContextMenu, {
        capture: true,
      })
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

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

  useEffect(() => {
    if (!game) {
      return
    }

    const hasRadialUi =
      snapshot.fieldContextMenu !== null ||
      snapshot.attachmentContextMenu !== null ||
      pendingSeed !== null
    if (!hasRadialUi) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }
      game.closeFieldContextMenu()
      game.closeAttachmentContextMenu()
      setPendingSeed(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [game, snapshot.fieldContextMenu, snapshot.attachmentContextMenu, pendingSeed])

  return (
    <div
      ref={shellRef}
      className="game-shell"
      onContextMenu={(event) => {
        event.preventDefault()
      }}
    >
      <canvas
        ref={canvasRef}
        className="game-shell__canvas"
        onContextMenu={(event) => {
          event.preventDefault()
        }}
      />
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
              case FieldRadialActionKind.Seed: {
                const anchor = clampRadialAnchor(
                  snapshot.fieldContextMenu!.screenX,
                  snapshot.fieldContextMenu!.screenY,
                )
                setPendingSeed({
                  fieldId,
                  screenX: anchor.x,
                  screenY: anchor.y,
                })
                game.closeFieldContextMenu()
                break
              }
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
      {game && pendingSeed ? (
        <ChooseCropRadialMenu
          screenX={pendingSeed.screenX}
          screenY={pendingSeed.screenY}
          crops={snapshot.crops}
          money={snapshot.money}
          onSelect={(cropId) => {
            game.plantField(pendingSeed.fieldId, cropId)
            setPendingSeed(null)
          }}
          onCancel={() => setPendingSeed(null)}
        />
      ) : null}
      {game && snapshot.attachmentContextMenu ? (
        <AttachmentRadialMenu
          menu={snapshot.attachmentContextMenu}
          onDismiss={() => game.closeAttachmentContextMenu()}
          onAction={(action) => {
            const menu = snapshot.attachmentContextMenu!
            const machineId =
              snapshot.selectedEntity.kind === 'machine'
                ? snapshot.selectedEntity.machineId
                : null
            if (!machineId) {
              return
            }
            switch (action) {
              case AttachmentRadialActionKind.Attach: {
                const slotId = menu.slotId
                if (!slotId) {
                  return
                }
                game.attachAttachment(
                  machineId,
                  slotId,
                  menu.attachmentId,
                )
                break
              }
              case AttachmentRadialActionKind.Detach: {
                const slotId = menu.slotId
                if (!slotId) {
                  return
                }
                game.detachAttachment(machineId, slotId)
                break
              }
              case AttachmentRadialActionKind.Cancel:
                game.closeAttachmentContextMenu()
                break
            }
          }}
        />
      ) : null}
    </div>
  )
}
