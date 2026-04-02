// Export vidéo via MediaRecorder + canvas captureStream
import { Canvas as FabricCanvas } from 'fabric'
import { animationEngine } from '../engine/animationEngine'

export interface ExportVideoOptions {
  fps:        number
  duration:   number
  quality:    number
  onProgress: (pct: number) => void
  onComplete: (blob: Blob) => void
  onError:    (err: Error) => void
}

export async function exportVideoMP4(
  fabricCanvas: FabricCanvas,
  opts: ExportVideoOptions
): Promise<void> {
  const { fps, duration, onProgress, onComplete, onError } = opts

  try {
    // Obtenir le canvas HTML sous-jacent
    const canvasEl = fabricCanvas.getElement() as HTMLCanvasElement

    // Créer un MediaRecorder sur le stream du canvas
    const stream = canvasEl.captureStream(fps)

    // Choisir le codec disponible dans le navigateur
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ]
    const mimeType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000, // 8 Mbps
    })

    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      onComplete(blob)
    }

    recorder.onerror = () => onError(new Error('Erreur MediaRecorder'))

    // Lancer l'enregistrement
    recorder.start(100) // chunk toutes les 100ms

    // Rejouer l'animation frame par frame
    animationEngine.stop()
    await sleep(100)

    const frameCount  = Math.ceil(duration * fps)
    const frameTimeMs = 1000 / fps

    for (let frame = 0; frame <= frameCount; frame++) {
      const time = frame / fps
      animationEngine.seek(time)
      fabricCanvas.requestRenderAll()

      onProgress(Math.round((frame / frameCount) * 100))

      // Attendre le temps d'une frame pour que le stream capture
      await sleep(frameTimeMs)
    }

    // Arrêter l'enregistrement
    recorder.stop()
    stream.getTracks().forEach((t) => t.stop())

    // Retour à t=0
    animationEngine.stop()

  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)))
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
