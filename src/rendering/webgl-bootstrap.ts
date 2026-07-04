import { Engine } from '@babylonjs/core'

const canvasReleaseWaits = new WeakMap<HTMLCanvasElement, Promise<void>>()

function waitFrames(frameCount: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = frameCount
    const step = () => {
      remaining -= 1
      if (remaining <= 0) {
        resolve()
        return
      }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

/** Wait until a canvas has non-zero layout size (required for WebGL). */
export async function waitForCanvasSize(
  canvas: HTMLCanvasElement,
  timeoutMs = 8000,
): Promise<void> {
  if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    let resizeObserver: ResizeObserver | null = null
    const timeout = window.setTimeout(() => {
      resizeObserver?.disconnect()
      reject(new Error('Canvas did not receive a layout size in time.'))
    }, timeoutMs)

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
          window.clearTimeout(timeout)
          resizeObserver?.disconnect()
          resolve()
        }
      })
      resizeObserver.observe(canvas)
    } else {
      const poll = () => {
        if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
          window.clearTimeout(timeout)
          resolve()
          return
        }
        requestAnimationFrame(poll)
      }
      requestAnimationFrame(poll)
    }
  })
}

export function isWebGLAvailable(): boolean {
  try {
    const probe = document.createElement('canvas')
    const context =
      probe.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ??
      probe.getContext('webgl', { failIfMajorPerformanceCaveat: false })
    return context !== null
  } catch {
    return false
  }
}

/** After engine.dispose(), wait before creating another engine on the same canvas. */
export function scheduleCanvasWebGLRelease(canvas: HTMLCanvasElement): void {
  canvasReleaseWaits.set(canvas, waitFrames(2))
}

export async function waitForCanvasWebGLRelease(
  canvas: HTMLCanvasElement,
): Promise<void> {
  await canvasReleaseWaits.get(canvas)
}

export interface CreateWebGLEngineOptions {
  antialias?: boolean
  adaptToDeviceRatio?: boolean
}

export async function createWebGLEngine(
  canvas: HTMLCanvasElement,
  options: CreateWebGLEngineOptions = {},
): Promise<Engine> {
  await waitForCanvasWebGLRelease(canvas)
  await waitForCanvasSize(canvas)

  if (!isWebGLAvailable()) {
    throw new Error(
      'WebGL není v tomto prohlížeči dostupné. Zkuste jiný prohlížeč nebo povolte hardwarovou akceleraci.',
    )
  }

  const engine = new Engine(canvas, options.antialias ?? true, {
    adaptToDeviceRatio: options.adaptToDeviceRatio ?? true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'default',
    stencil: true,
    preserveDrawingBuffer: false,
  })

  if (!engine) {
    throw new Error('Nepodařilo se vytvořit WebGL kontext.')
  }

  return engine
}
