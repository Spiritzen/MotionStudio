// Éditeur de canvas — RÉÉCRITURE SPRINT 5 : architecture propre, zéro conflit
import { useEffect, useRef } from 'react'
import {
  Canvas as FabricCanvas,
  Rect, Circle, IText,
  Image as FabricImage,
  FabricObject,
} from 'fabric'
import { useObjectStore } from '../../store/objectStore'
import { useTimelineStore } from '../../store/timelineStore'
import { useUIStore } from '../../store/uiStore'
import { animationEngine } from '../../engine/animationEngine'
import { MotionObject } from '../../types'
import { generateId } from '../../utils/generateId'
import styles from './CanvasEditor.module.css'

interface CanvasEditorProps {
  onCanvasReady: (canvas: FabricCanvas) => void
  onCapture?: () => void
}

// Compteurs pour nommer les objets automatiquement
const compteurs: Record<string, number> = {}
function getNomObjet(type: string): string {
  compteurs[type] = (compteurs[type] || 0) + 1
  const noms: Record<string, string> = {
    rect: 'Rectangle', circle: 'Cercle', text: 'Texte', image: 'Image', video: 'Vidéo',
  }
  return `${noms[type] || type} ${compteurs[type]}`
}

const MAX_CANVAS_WIDTH  = 900
const MAX_CANVAS_HEIGHT = 600

function calcScale(w: number, h: number): number {
  return Math.min(MAX_CANVAS_WIDTH / w, MAX_CANVAS_HEIGHT / h, 1)
}

export default function CanvasEditor({ onCanvasReady, onCapture }: CanvasEditorProps) {
  const canvasElRef    = useRef<HTMLCanvasElement>(null)
  const fabricRef      = useRef<FabricCanvas | null>(null)
  const isDraggingRef  = useRef(false)
  const activeToolRef  = useRef('select')  // ref pour éviter stale closure dans le handler mouse:down
  const captureRef     = useRef<(() => void) | undefined>(onCapture)
  captureRef.current   = onCapture

  const { addObject, removeObject, selectObject } = useObjectStore()
  const { removeTracksForObject } = useTimelineStore()
  const { activeTool, setActiveTool, activeFormat, setDirty, forceInspectorUpdate, canvasZoom, setCanvasZoom } = useUIStore()

  // ── Init Fabric — une seule fois ───────────────────────────────────────────
  useEffect(() => {
    if (!canvasElRef.current) return

    const scale    = calcScale(activeFormat.width, activeFormat.height)
    const displayW = Math.round(activeFormat.width  * scale)
    const displayH = Math.round(activeFormat.height * scale)

    const canvas = new FabricCanvas(canvasElRef.current, {
      width:                  displayW,
      height:                 displayH,
      backgroundColor:        '#1a1f2e',
      preserveObjectStacking: true,
      selection:              true,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(canvas as any)._motionScale = scale

    fabricRef.current = canvas
    animationEngine.init(canvas)
    onCanvasReady(canvas)

    // ── Événements de sélection ────────────────────────────────────────────
    canvas.on('selection:created', (e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = (e.selected?.[0] as any)?.motionId as string | undefined
      if (id) selectObject(id)
    })
    canvas.on('selection:updated', (e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = (e.selected?.[0] as any)?.motionId as string | undefined
      if (id) selectObject(id)
    })
    canvas.on('selection:cleared', () => selectObject(null))

    // ── Modifications (drag, resize, rotate) → refresh Inspector + dirty ──
    const onInteract = () => {
      forceInspectorUpdate()
      setDirty(true)
    }
    canvas.on('object:modified', () => { onInteract(); captureRef.current?.() })
    canvas.on('object:moving',   onInteract)
    canvas.on('object:scaling',  onInteract)
    canvas.on('object:rotating', onInteract)

    // ── CustomEvent depuis Toolbar → même pattern que image/vidéo (garanti fonctionnel) ─
    // Variable locale dans la closure — jamais stale, zéro React/Zustand dans le chemin critique
    let pendingTool: string | null = null

    const onCreateTool = (e: Event) => {
      const tool = (e as CustomEvent<{ tool: string }>).detail.tool

      if (tool === 'select') {
        pendingTool = null
        canvas.selection    = true
        canvas.defaultCursor = 'default'
        canvas.hoverCursor  = 'move'
        canvas.getObjects().forEach((obj) => { obj.selectable = true; obj.evented = true })
        canvas.requestRenderAll()
        return
      }

      pendingTool          = tool
      canvas.selection     = false
      canvas.defaultCursor = 'crosshair'
      canvas.hoverCursor   = 'crosshair'
      canvas.getObjects().forEach((obj) => { obj.selectable = false; obj.evented = false })
      canvas.discardActiveObject()
      canvas.requestRenderAll()
    }

    window.addEventListener('motionstudio:create', onCreateTool)

    // ── Handler mouse:down — lit pendingTool (closure locale, jamais stale) ─
    canvas.on('mouse:down', (e: any) => {
      if (!pendingTool) return
      if (e.target) return   // clic sur objet existant → ne pas créer

      const tool = pendingTool

      // Coordonnées en espace scène (après zoom/pan) — absolutePointer / scenePoint
      // Fabric les calcule automatiquement en tenant compte du viewport transform
      const sp = e.absolutePointer ?? e.scenePoint
      let x: number, y: number
      if (sp) {
        x = sp.x
        y = sp.y
      } else {
        // Fallback manuel : diviser par le zoom courant
        const nativeEvent = e.e as MouseEvent
        const canvasEl = canvas.getElement()
        const domRect  = canvasEl.getBoundingClientRect()
        const zf = useUIStore.getState().canvasZoom > 0 ? useUIStore.getState().canvasZoom / 100 : 1
        x = (nativeEvent.clientX - domRect.left) / zf
        y = (nativeEvent.clientY - domRect.top)  / zf
      }

      const id = generateId()
      let fabricObj: FabricObject | null = null

      // ── Création Fabric ──────────────────────────────────────────────────
      try {
        if (tool === 'rect') {
          fabricObj = new Rect({
            left: x - 75, top: y - 50,
            width: 150, height: 100,
            fill: '#8b5cf6',
            rx: 4, ry: 4,
          })
        } else if (tool === 'circle') {
          fabricObj = new Circle({
            left: x - 50, top: y - 50,
            radius: 50,
            fill: '#f59e0b',
          })
        } else if (tool === 'text') {
          fabricObj = new IText('Texte', {
            left: x, top: y,
            fontSize: 32,
            fill: '#e2e8f0',
            fontFamily: 'Inter, system-ui, sans-serif',
          })
        } else {
          return
        }

        fabricObj.set({
          selectable:    true,  evented:       true,
          hasControls:   true,  hasBorders:    true,
          lockMovementX: false, lockMovementY: false,
          lockScalingX:  false, lockScalingY:  false,
          lockRotation:  false,
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fabricObj as any).motionId = id

        canvas.add(fabricObj)
        canvas.setActiveObject(fabricObj)
        canvas.renderAll()   // rendu synchrone — garantit la visibilité immédiate

        if (tool === 'text') {
          (fabricObj as IText).enterEditing()
        }
      } catch (errFabric) {
        console.error('[Canvas] ERREUR création Fabric:', errFabric)
        return
      }

      // Retour immédiat au mode sélecteur — réactiver tous les objets
      pendingTool          = null
      canvas.selection     = true
      canvas.defaultCursor = 'default'
      canvas.hoverCursor   = 'move'
      canvas.getObjects().forEach((obj) => { obj.selectable = true; obj.evented = true })
      canvas.renderAll()   // re-render avec poignées de sélection

      // ── Mise à jour du store ─────────────────────────────────────────────
      try {
        const dur = useTimelineStore.getState().duration
        addObject({
          id, fabricId: id,
          name:      getNomObjet(tool),
          type:      tool as MotionObject['type'],
          visible:   true,
          locked:    false,
          startTime: 0,
          endTime:   dur,
        })
        selectObject(id)
        setDirty(true)
        setActiveTool('select')  // sync store + feedback visuel bouton toolbar
        captureRef.current?.()
      } catch (errStore) {
        console.error('[Canvas] ERREUR store:', errStore)
      }
    })

    // ── Garde anti-conflit pour le render loop vidéo ─────────────────────
    canvas.on('mouse:move', (e: any) => {
      isDraggingRef.current = !!(e.e?.buttons)  // true seulement si bouton pressé pendant mouvement
    })
    canvas.on('mouse:up', () => { isDraggingRef.current = false })

    return () => {
      window.removeEventListener('motionstudio:create', onCreateTool)
      animationEngine.dispose()
      canvas.dispose()
      fabricRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Synchroniser le mode Fabric avec l'outil actif ────────────────────────
  useEffect(() => {
    activeToolRef.current = activeTool  // sync ref (toujours mis à jour, même si getState() est utilisé dans le handler)
    const canvas = fabricRef.current
    if (!canvas) return

    if (activeTool === 'select') {
      canvas.isDrawingMode  = false
      canvas.skipTargetFind = false   // CRITIQUE : permet de trouver les objets au clic
      canvas.selection      = true
      canvas.defaultCursor  = 'default'
      canvas.hoverCursor    = 'move'
      canvas.getObjects().forEach((obj) => {
        obj.selectable    = true
        obj.evented       = true
        obj.hasControls   = true
        obj.hasBorders    = true
        obj.lockMovementX = false
        obj.lockMovementY = false
        obj.lockScalingX  = false
        obj.lockScalingY  = false
        obj.lockRotation  = false
      })
    } else {
      // Mode création : canvas reçoit les clics mais les objets sont non-sélectionnables
      canvas.isDrawingMode  = false
      canvas.skipTargetFind = false   // false : reçoit les clics sur le canvas vide
      canvas.selection      = false
      canvas.defaultCursor  = 'crosshair'
      canvas.hoverCursor    = 'crosshair'
      canvas.getObjects().forEach((obj) => {
        obj.selectable = false
        obj.evented    = false
      })
      canvas.discardActiveObject()
    }
    canvas.renderAll()
  }, [activeTool])

  // ── Import image / vidéo via CustomEvent depuis la Toolbar ────────────────
  useEffect(() => {
    const handleImageInput = (e: Event) => {
      const file = (e as CustomEvent<File>).detail
      if (!file || !fabricRef.current) return
      const canvas = fabricRef.current
      const url    = URL.createObjectURL(file)
      const id     = generateId()

      FabricImage.fromURL(url).then((img) => {
        if (!fabricRef.current) return
        img.scaleToWidth(200)
        img.set({
          left: 100, top: 100,
          selectable: true, evented: true,
          hasControls: true, hasBorders: true,
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(img as any).motionId = id
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
        const dur = useTimelineStore.getState().duration
        addObject({ id, fabricId: id, name: getNomObjet('image'), type: 'image', visible: true, locked: false, startTime: 0, endTime: dur })
        selectObject(id)
        setDirty(true)
        captureRef.current?.()
      })
    }

    const handleVideoInput = (e: Event) => {
      const file = (e as CustomEvent<File>).detail
      if (!file || !fabricRef.current) return
      const canvas = fabricRef.current

      const url     = URL.createObjectURL(file)
      const videoEl = document.createElement('video')
      videoEl.muted       = true
      videoEl.playsInline = true
      videoEl.loop        = false   // esclave de la timeline — pas de boucle auto
      videoEl.preload     = 'auto'

      videoEl.addEventListener('loadeddata', () => {
        const id    = generateId()
        const vw    = videoEl.videoWidth  || 640
        const vh    = videoEl.videoHeight || 360
        const scale = Math.min(1, 640 / vw, 360 / vh)

        // Canvas 2D intermédiaire — Fabric v6 ne lit pas les vidéos nativement
        const offscreen    = document.createElement('canvas')
        offscreen.width    = vw
        offscreen.height   = vh
        const ctx          = offscreen.getContext('2d')!

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fabricVideo = new FabricImage(offscreen as unknown as HTMLImageElement, {
          left: 50, top: 50,
          width: vw, height: vh,
          scaleX: scale, scaleY: scale,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          objectCaching: false as any,   // CRITIQUE : désactive le cache de frame
          selectable: true, evented: true,
          hasControls: true, hasBorders: true,
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fabricVideo as any).motionId = id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fabricVideo as any)._videoEl = videoEl

        // Figer sur frame 0 — NE PAS appeler play() ici
        videoEl.pause()
        videoEl.currentTime = 0

        canvas.add(fabricVideo)
        canvas.setActiveObject(fabricVideo)

        // RAF render loop : copie la frame vidéo courante dans le canvas intermédiaire
        let rafId: number
        const renderFrame = () => {
          if (videoEl.readyState >= 2) {
            ctx.drawImage(videoEl, 0, 0, vw, vh)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(fabricVideo as any).dirty = true
            // Skip renderAll() pendant un drag Fabric pour éviter les conflits
            if (!isDraggingRef.current) {
              canvas.renderAll()
            }
          }
          rafId = requestAnimationFrame(renderFrame)
        }
        rafId = requestAnimationFrame(renderFrame)

        // Cleanup : arrêter RAF + libérer blob URL
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fabricVideo as any)._stopRenderLoop = () => {
          cancelAnimationFrame(rafId)
          videoEl.pause()
          URL.revokeObjectURL(url)
        }

        canvas.renderAll()
        const timelineDur = useTimelineStore.getState().duration
        addObject({ id, fabricId: id, name: getNomObjet('video'), type: 'video', visible: true, locked: false, startTime: 0, endTime: Math.min(videoEl.duration || timelineDur, timelineDur), volume: 1, muted: false })
        selectObject(id)
        setDirty(true)
        captureRef.current?.()
      })

      videoEl.addEventListener('error', () => {
        console.error('[MotionStudio] Impossible de charger la vidéo')
        URL.revokeObjectURL(url)
      })

      videoEl.src = url
      videoEl.load()
    }

    window.addEventListener('motionstudio:image-input', handleImageInput as EventListener)
    window.addEventListener('motionstudio:video-input', handleVideoInput as EventListener)
    return () => {
      window.removeEventListener('motionstudio:image-input', handleImageInput as EventListener)
      window.removeEventListener('motionstudio:video-input', handleVideoInput as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Ctrl+wheel → zoom canvas ─────────────────────────────────────────────
  useEffect(() => {
    const ZOOM_LEVELS = [10, 25, 33, 50, 67, 75, 100, 125, 150, 200]
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const current = useUIStore.getState().canvasZoom || 100
      if (e.deltaY < 0) {
        const next = ZOOM_LEVELS.find(z => z > current)
        if (next !== undefined) setCanvasZoom(next)
      } else {
        const prev = [...ZOOM_LEVELS].reverse().find(z => z < current)
        if (prev !== undefined) setCanvasZoom(prev)
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [setCanvasZoom])

  // ── Suppression clavier (Delete/Backspace) et Escape ─────────────────────
  useEffect(() => {
    const ZOOM_LEVELS = [10, 25, 33, 50, 67, 75, 100, 125, 150, 200]
    const onKeyDown = (e: KeyboardEvent) => {
      const canvas = fabricRef.current
      if (!canvas) return

      // Ctrl+= / Ctrl++ → zoom in
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        const current = useUIStore.getState().canvasZoom || 100
        const next = ZOOM_LEVELS.find(z => z > current)
        if (next !== undefined) setCanvasZoom(next)
        return
      }
      // Ctrl+- → zoom out
      if (e.ctrlKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault()
        const current = useUIStore.getState().canvasZoom || 100
        const prev = [...ZOOM_LEVELS].reverse().find(z => z < current)
        if (prev !== undefined) setCanvasZoom(prev)
        return
      }
      // Ctrl+0 → fit
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault()
        setCanvasZoom(0)
        return
      }

      // Escape → retour au sélecteur
      if (e.key === 'Escape') {
        setActiveTool('select')
        canvas.discardActiveObject()
        canvas.renderAll()
        return
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return

      const active = canvas.getActiveObject()
      if (!active) return
      // Ne pas supprimer pendant l'édition de texte inline
      if (active.type === 'i-text' && (active as IText).isEditing) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const motionId = (active as any).motionId as string | undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stopLoop = (active as any)._stopRenderLoop as (() => void) | undefined
      if (stopLoop) stopLoop()

      canvas.remove(active)
      canvas.discardActiveObject()
      canvas.renderAll()

      if (motionId) {
        removeObject(motionId)
        removeTracksForObject(motionId)
        setDirty(true)
        captureRef.current?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [removeObject, removeTracksForObject, setDirty, setActiveTool, setCanvasZoom])

  // ── Format + zoom → redimensionner et zoomer le canvas ───────────────────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const scale    = calcScale(activeFormat.width, activeFormat.height)
    const displayW = Math.round(activeFormat.width  * scale)
    const displayH = Math.round(activeFormat.height * scale)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(canvas as any)._motionScale = scale
    const zf = canvasZoom > 0 ? canvasZoom / 100 : 1
    canvas.setZoom(zf)
    canvas.setDimensions({ width: Math.round(displayW * zf), height: Math.round(displayH * zf) })
    canvas.renderAll()
  }, [activeFormat, canvasZoom])

  return (
    <div className={styles.scrollContainer}>
      <div className={styles.canvasOuter}>
        <div className={styles.canvasContainer}>
          <canvas ref={canvasElRef} />
        </div>
      </div>
    </div>
  )
}
