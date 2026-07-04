import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Game } from '@core/Game.ts'
import { EMPTY_GAME_SNAPSHOT } from '@core/GameSnapshot.ts'
import { FieldRadialActionKind } from '@/types/machine.ts'
import { clampRadialAnchor } from '@/utils/radial-menu-position.ts'
import { GameHUD } from './GameHUD.tsx'
import { ChooseCropRadialMenu } from './ChooseCropRadialMenu.tsx'
import { RadialContextMenu } from './RadialContextMenu.tsx'
import { FieldWorkModeRadialMenu } from './FieldWorkModeRadialMenu.tsx'
import { getFieldWorkTaskLabel } from './fieldWorkTaskLabel.ts'
import { AttachmentRadialMenu } from './AttachmentRadialMenu.tsx'
import { MachineRadialMenu } from './MachineRadialMenu.tsx'
import { InteractionRadialMenu } from './InteractionRadialMenu.tsx'
import { FarmStorePanel } from './FarmStorePanel.tsx'
import { FleetPanel } from './FleetPanel.tsx'
import { AttachmentRadialActionKind } from '@/types/attachment.ts'
import {
  InteractionRadialActionKind,
} from '@/types/interaction-point.ts'
import { MachineRadialActionKind } from '@/types/machine.ts'
import type { GameSessionConfig } from '@game/GameSession.ts'
import './GameShell.css'
import '@/studio/StudioShell.css'

interface GameShellProps {
  session: GameSessionConfig
  onExit?: () => void
  onSwitchToStudio?: () => void
}

interface PendingSeedWork {
  fieldId: string
  screenX: number
  screenY: number
  useGps: boolean
  gpsScope: 'this_field' | 'selected_fields' | 'entire_block'
}

export function GameShell({ session, onExit, onSwitchToStudio }: GameShellProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [startError, setStartError] = useState<string | null>(null)
  const [pendingSeed, setPendingSeed] = useState<PendingSeedWork | null>(null)

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
    let gameInstance: Game | null = null
    setLoading(true)
    setStartError(null)

    const frame = requestAnimationFrame(() => {
      if (!active || !canvasRef.current) {
        return
      }

      gameInstance = new Game(canvasRef.current)
      void gameInstance
        .start(session)
        .then(() => {
          if (active) {
            setGame(gameInstance)
            setLoading(false)
          } else {
            gameInstance?.dispose()
          }
        })
        .catch((error: unknown) => {
          if (active) {
            setStartError(
              error instanceof Error ? error.message : 'Failed to start game',
            )
            setLoading(false)
            gameInstance?.dispose()
          }
        })
    })

    return () => {
      active = false
      cancelAnimationFrame(frame)
      gameInstance?.dispose()
      setGame(null)
      setLoading(false)
    }
  }, [session])

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
      snapshot.fieldWorkModeMenu !== null ||
      snapshot.attachmentContextMenu !== null ||
      snapshot.machineContextMenu !== null ||
      snapshot.interactionContextMenu !== null ||
      pendingSeed !== null
    if (!hasRadialUi) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }
      game.closeFieldContextMenu()
      game.closeFieldWorkModeMenu()
      game.closeAttachmentContextMenu()
      game.closeMachineContextMenu()
      game.closeInteractionContextMenu()
      setPendingSeed(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [
    game,
    snapshot.fieldContextMenu,
    snapshot.fieldWorkModeMenu,
    snapshot.attachmentContextMenu,
    snapshot.machineContextMenu,
    snapshot.interactionContextMenu,
    pendingSeed,
  ])

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
      {onSwitchToStudio || onExit ? (
        <div className="game-shell__top-actions">
          {onExit ? (
            <button
              type="button"
              className="game-mode-switch"
              onClick={() => {
                game?.saveGame()
                onExit()
              }}
              title="Return to main menu"
            >
              Menu
            </button>
          ) : null}
          {onSwitchToStudio ? (
            <button
              type="button"
              className="game-mode-switch"
              onClick={onSwitchToStudio}
              title="Open FarmOS Studio (F10)"
            >
              Studio
            </button>
          ) : null}
        </div>
      ) : null}
      {loading ? (
        <div className="game-shell__loading">Loading farm…</div>
      ) : null}
      {startError ? (
        <div className="game-shell__error">
          <p>{startError}</p>
          {onExit ? (
            <button type="button" onClick={onExit}>
              Back to menu
            </button>
          ) : null}
        </div>
      ) : null}
      {game ? <GameHUD game={game} snapshot={snapshot} /> : null}
      {game && snapshot.fieldContextMenu ? (
        <RadialContextMenu
          menu={snapshot.fieldContextMenu}
          onDismiss={() => game.closeFieldContextMenu()}
          onAction={(action) => {
            const menu = snapshot.fieldContextMenu!
            if (action === FieldRadialActionKind.Cancel) {
              game.closeFieldContextMenu()
              return
            }
            game.openFieldWorkModeMenu(
              menu.fieldId,
              action,
              menu.screenX,
              menu.screenY,
            )
          }}
        />
      ) : null}
      {game && snapshot.fieldWorkModeMenu ? (
        <FieldWorkModeRadialMenu
          menu={snapshot.fieldWorkModeMenu}
          taskLabel={getFieldWorkTaskLabel(snapshot.fieldWorkModeMenu.taskKind)}
          onDismiss={() => game.closeFieldWorkModeMenu()}
          onPerformManually={() => {
            const menu = snapshot.fieldWorkModeMenu!
            if (menu.taskKind === FieldRadialActionKind.Seed) {
              const anchor = clampRadialAnchor(menu.screenX, menu.screenY)
              setPendingSeed({
                fieldId: menu.fieldId,
                screenX: anchor.x,
                screenY: anchor.y,
                useGps: false,
                gpsScope: 'this_field',
              })
              game.closeFieldWorkModeMenu()
              return
            }
            game.performFieldWorkManually(menu.fieldId, menu.taskKind)
          }}
          onGpsThisField={() => {
            const menu = snapshot.fieldWorkModeMenu!
            if (menu.taskKind === FieldRadialActionKind.Seed) {
              const anchor = clampRadialAnchor(menu.screenX, menu.screenY)
              setPendingSeed({
                fieldId: menu.fieldId,
                screenX: anchor.x,
                screenY: anchor.y,
                useGps: true,
                gpsScope: 'this_field',
              })
              game.closeFieldWorkModeMenu()
              return
            }
            game.performFieldWorkGps(menu.fieldId, menu.taskKind, {
              gpsScope: 'this_field',
            })
          }}
          onGpsSelectedFields={() => {
            const menu = snapshot.fieldWorkModeMenu!
            if (menu.taskKind === FieldRadialActionKind.Seed) {
              const anchor = clampRadialAnchor(menu.screenX, menu.screenY)
              setPendingSeed({
                fieldId: menu.fieldId,
                screenX: anchor.x,
                screenY: anchor.y,
                useGps: true,
                gpsScope: 'selected_fields',
              })
              game.closeFieldWorkModeMenu()
              return
            }
            game.performFieldWorkGps(menu.fieldId, menu.taskKind, {
              gpsScope: 'selected_fields',
            })
          }}
          onGpsEntireBlock={() => {
            const menu = snapshot.fieldWorkModeMenu!
            if (menu.taskKind === FieldRadialActionKind.Seed) {
              const anchor = clampRadialAnchor(menu.screenX, menu.screenY)
              setPendingSeed({
                fieldId: menu.fieldId,
                screenX: anchor.x,
                screenY: anchor.y,
                useGps: true,
                gpsScope: 'entire_block',
              })
              game.closeFieldWorkModeMenu()
              return
            }
            game.performFieldWorkGps(menu.fieldId, menu.taskKind, {
              gpsScope: 'entire_block',
            })
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
            if (pendingSeed.useGps) {
              game.performFieldWorkGps(
                pendingSeed.fieldId,
                FieldRadialActionKind.Seed,
                { cropId, gpsScope: pendingSeed.gpsScope },
              )
            } else {
              game.plantField(pendingSeed.fieldId, cropId)
            }
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
      {game && snapshot.machineContextMenu ? (
        <MachineRadialMenu
          menu={snapshot.machineContextMenu}
          onDismiss={() => game.closeMachineContextMenu()}
          onAction={(action) => {
            const menu = snapshot.machineContextMenu!
            switch (action) {
              case MachineRadialActionKind.LoadFromCombine:
                game.loadFromCombine(menu.targetMachineId)
                break
              case MachineRadialActionKind.Cancel:
                game.closeMachineContextMenu()
                break
            }
          }}
        />
      ) : null}
      {game && snapshot.interactionContextMenu ? (
        <InteractionRadialMenu
          menu={snapshot.interactionContextMenu}
          onDismiss={() => game.closeInteractionContextMenu()}
          onAction={(action) => {
            const menu = snapshot.interactionContextMenu!
            switch (action) {
              case InteractionRadialActionKind.OpenStore:
                game.openFarmStoreFromInteraction(menu.interactionPointId)
                break
              case InteractionRadialActionKind.UnloadToSilo:
                game.unloadToSilo(menu.interactionPointId)
                break
              case InteractionRadialActionKind.Cancel:
                game.closeInteractionContextMenu()
                break
            }
          }}
        />
      ) : null}
      {game ? (
        <FarmStorePanel game={game} farmStore={snapshot.farmStore} />
      ) : null}
      {game ? (
        <FleetPanel
          game={game}
          open={snapshot.fleetPanelOpen}
          fleet={snapshot.fleet}
        />
      ) : null}
    </div>
  )
}
