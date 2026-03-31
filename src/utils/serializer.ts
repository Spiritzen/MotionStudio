// Sérialisation / désérialisation complète du projet avec médias en base64
import { Canvas as FabricCanvas, Image as FabricImage } from 'fabric'
import { Project, MotionObject, AnimationTrack, CanvasFormat, MediaCacheEntry } from '../types'
import { generateId } from './generateId'
import { audioManager } from '../engine/audioManager'
import { audioBufferToWav } from './audioUtils'

interface SerializeStores {
  objects: MotionObject[]
  tracks: AnimationTrack[]
  ui: { projectName: string; activeFormat: CanvasFormat }
}

interface SerializeMeta {
  duration: number
  fps: number
}

// ── Helper : blob → data URL ─────────────────────────────────────────────────
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ── Helper : data URL → Blob ─────────────────────────────────────────────────
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data]  = dataUrl.split(',')
  const mimeType        = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream'
  const binary          = atob(data)
  const bytes           = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

// ── Sérialise l'état complet en objet Project avec médias embarqués ──────────
export async function serializeProject(
  fabricCanvas: FabricCanvas,
  stores: SerializeStores,
  meta: SerializeMeta
): Promise<Project> {
  const { objects, tracks, ui } = stores
  const now    = new Date().toISOString()
  const format = ui.activeFormat

  const mediaCache: Record<string, MediaCacheEntry> = {}

  // Capturer le JSON Fabric avec motionId inclus comme propriété personnalisée
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricJSON = (fabricCanvas as any).toJSON(['motionId', 'objectCaching', 'visible']) as {
    objects?: Record<string, unknown>[]
  } & object

  // ── Parcourir les objets Fabric pour capturer vidéo et image ─────────────
  for (const fabricObj of fabricCanvas.getObjects()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const motionId = (fabricObj as any).motionId as string | undefined
    if (!motionId) continue

    const motionObj = objects.find(o => o.id === motionId)
    if (!motionObj) continue

    // Trouver l'entrée correspondante dans fabricJSON.objects
    const jsonObj = fabricJSON.objects?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o: any) => o.motionId === motionId
    )

    // ── Vidéo ──────────────────────────────────────────────────────────────
    if (motionObj.type === 'video') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const videoEl   = (fabricObj as any)._videoEl   as HTMLVideoElement | undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const offscreen = (fabricObj as any)._offscreen as HTMLCanvasElement | undefined

      // Capturer le binaire vidéo en base64
      if (videoEl?.src?.startsWith('blob:')) {
        try {
          const blob   = await fetch(videoEl.src).then(r => r.blob())
          const dataUrl = await blobToDataUrl(blob)
          mediaCache[motionId] = {
            type: 'video', dataUrl,
            mimeType: blob.type || 'video/mp4',
            filename: motionObj.name,
          }
        } catch {
          console.warn('[Serializer] Impossible de sérialiser la vidéo:', motionId)
        }
      }

      // Patch fabricJSON : remplacer le src vide/invalide par une frame JPEG
      // → permet à Fabric de restaurer l'image statique correctement
      if (offscreen && jsonObj) {
        jsonObj['src'] = offscreen.toDataURL('image/jpeg', 0.8)
      }
    }

    // ── Image ──────────────────────────────────────────────────────────────
    if (motionObj.type === 'image') {
      const imgEl = (fabricObj as FabricImage).getElement() as HTMLImageElement | undefined
      if (imgEl?.src?.startsWith('blob:')) {
        try {
          const blob   = await fetch(imgEl.src).then(r => r.blob())
          const dataUrl = await blobToDataUrl(blob)
          mediaCache[motionId] = {
            type: 'image', dataUrl,
            mimeType: blob.type || 'image/png',
            filename: motionObj.name,
          }
          // Patch fabricJSON : remplacer le blob URL par le data URL permanent
          if (jsonObj) jsonObj['src'] = dataUrl
        } catch {
          console.warn('[Serializer] Impossible de sérialiser l\'image:', motionId)
        }
      }
    }
  }

  // ── Capturer les pistes audio en base64 ──────────────────────────────────
  for (const obj of objects.filter(o => o.type === 'audio')) {
    const buffer = audioManager.getBuffer(obj.id)
    if (buffer) {
      try {
        const wav    = audioBufferToWav(buffer)
        const bytes  = new Uint8Array(wav)
        let binary   = ''
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
        const dataUrl = `data:audio/wav;base64,${btoa(binary)}`
        mediaCache[obj.id] = {
          type: 'audio', dataUrl,
          mimeType: 'audio/wav',
          filename: obj.name,
        }
      } catch {
        console.warn('[Serializer] Impossible de sérialiser l\'audio:', obj.id)
      }
    }
  }

  return {
    id:         generateId(),
    name:       ui.projectName,
    version:    '1.1.0',
    createdAt:  now,
    updatedAt:  now,
    duration:   meta.duration,
    fps:        meta.fps,
    format,
    canvas: {
      width:           format.width,
      height:          format.height,
      backgroundColor: (fabricCanvas.backgroundColor as string) || '#1a1f2e',
    },
    objects,
    fabricJSON,
    timeline:   tracks,
    mediaCache: Object.keys(mediaCache).length > 0 ? mediaCache : undefined,
  }
}

// ── Restaure l'état complet depuis un objet Project ──────────────────────────
export async function deserializeProject(
  project: Project,
  fabricCanvas: FabricCanvas,
  setObjects: (objects: MotionObject[]) => void,
  setTracks: (tracks: AnimationTrack[]) => void,
  setUi: (name: string, format: CanvasFormat) => void
): Promise<void> {
  // 1. Restaurer le canvas Fabric (positions, styles, formes, textes)
  //    Les images sont chargées depuis leur src (data URL si sérialisé avec médias)
  await fabricCanvas.loadFromJSON(project.fabricJSON)
  fabricCanvas.setDimensions({ width: project.canvas.width, height: project.canvas.height })
  fabricCanvas.backgroundColor = project.canvas.backgroundColor
  fabricCanvas.renderAll()

  // 2. Restaurer les médias depuis mediaCache
  const mediaCache = project.mediaCache ?? {}

  for (const [motionId, media] of Object.entries(mediaCache)) {
    if (media.type === 'video') {
      const blob    = dataUrlToBlob(media.dataUrl)
      const url     = URL.createObjectURL(blob)
      const videoEl = document.createElement('video')
      videoEl.src         = url
      videoEl.muted       = true
      videoEl.playsInline = true
      videoEl.loop        = false
      videoEl.preload     = 'auto'

      await new Promise<void>(resolve => {
        videoEl.onloadeddata = () => resolve()
        videoEl.onerror      = () => resolve()  // ne pas bloquer en cas d'erreur
        videoEl.load()
      })

      // Trouver l'objet Fabric correspondant par motionId
      const fabricObj = fabricCanvas.getObjects().find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        o => (o as any).motionId === motionId
      )
      if (fabricObj) {
        const motionObj   = project.objects.find(o => o.id === motionId)
        const videoOffset = motionObj?.videoOffset ?? 0
        const vw          = videoEl.videoWidth  || 640
        const vh          = videoEl.videoHeight || 360

        const offscreen   = document.createElement('canvas')
        offscreen.width   = vw
        offscreen.height  = vh
        const ctx         = offscreen.getContext('2d')!

        videoEl.currentTime = videoOffset
        videoEl.pause()
        if (videoEl.readyState >= 2) {
          ctx.drawImage(videoEl, 0, 0, vw, vh)
        }

        // Remplacer l'élément interne de Fabric par l'offscreen canvas
        // → Fabric appellera drawImage(offscreen) à chaque renderAll()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fabricObj as any)._element  = offscreen
        fabricObj.objectCaching       = false

        // Attacher les refs que le master render loop attend
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fabricObj as any)._videoEl   = videoEl
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fabricObj as any)._offscreen = offscreen
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fabricObj as any)._ctx       = ctx
      }
    }

    if (media.type === 'audio') {
      try {
        const blob      = dataUrlToBlob(media.dataUrl)
        const file      = new File([blob], `${media.filename}.wav`, { type: media.mimeType })
        const motionObj = project.objects.find(o => o.id === motionId)
        await audioManager.loadFile(motionId, file, motionObj?.startTime ?? 0)
      } catch (e) {
        console.warn('[Deserializer] Impossible de restaurer l\'audio:', motionId, e)
      }
    }
    // Les images sont déjà restaurées par loadFromJSON (src = data URL)
  }

  // 3. Restaurer les stores
  setObjects(project.objects)
  setTracks(project.timeline)
  setUi(project.name, project.format)

  fabricCanvas.requestRenderAll()
}
