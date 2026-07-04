import { useEffect, useRef } from 'react'
import { Game } from '@core/Game.ts'
import { defaultSlotId } from '@/types/save-slot.ts'
import type { GameConfig } from '@/types/index.ts'

interface GameCanvasProps {
  config?: GameConfig
}

const DEV_SESSION = {
  slotId: defaultSlotId(1),
  mapId: 'map_01',
  farmName: 'Dev Farm',
  difficultyId: 'standard' as const,
  isNewGame: true,
}

export function GameCanvas({ config }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    let active = true
    const game = new Game(canvas, config)

    void game.start(DEV_SESSION).then(() => {
      if (!active) {
        game.dispose()
      }
    })

    return () => {
      active = false
      game.dispose()
    }
  }, [config])

  return <canvas ref={canvasRef} className="game-canvas" />
}
