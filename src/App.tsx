// App.tsx — layout principal de MotionStudio
import { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas as FabricCanvas, Image as FabricImage } from 'fabric'
import CanvasEditor from './components/Canvas/CanvasEditor'
import Toolbar from './components/Toolbar/Toolbar'
import Inspector from './components/Inspector/Inspector'
import PlaybackControls from './components/PlaybackControls/PlaybackControls'
import Timeline from './components/Timeline/Timeline'
import ProjectManager from './components/ProjectManager/ProjectManager'
import { useObjectStore } from './store/objectStore'
import { useTimelineStore } from './store/timelineStore'
import { useUIStore } from './store/uiStore'
import { animationEngine } from './engine/animationEngine'
import { audioManager } from './engine/audioManager'
import { loadFromLocalStorage, startAutosave } from './utils/storage'
import { deserializeProject } from './utils/serializer'
import { serializeProject } from './utils/serializer'
import { useHistoryStore, HistorySnapshot } from './store/historyStore'
import { splitClip } from './utils/splitClip'
import styles from './App.module.css'

export default function App() {
  const fabricCanvasRef = useRef<FabricCanvas | null>(null)
  const [fabricReady, setFabricReady] = useState(false)

  const { setObjects, addObject, updateObject, selectObject } = useObjectStore()
  const { pushSnapshot, undo, redo } = useHistoryStore()
  const { tracks, setTracks, setCurrentTime, setIsPlaying, duration, fps } = useTimelineStore()
  const { projectName, isDirty, activeFormat, setActiveFormat, setProjectName, setDirty, setTimelineMode } = useUIStore()

  // Callback quand le canvas Fabric est prêt
  const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
    fabricCanvasRef.current = canvas
    setFabricReady(true)
  }, [])

  // ── Snapshot helpers ────────────────────────────────────────────────────
  const captureSnapshot = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    pushSnapshot({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fabricJSON:  (canvas as any).toJSON(['motionId']),
      objectsJSON: JSON.stringify(useObjectStore.getState().objects),
    })
  }, [pushSnapshot])

  const applySnapshot = useCallback(async (snapshot: HistorySnapshot | null) => {
    if (!snapshot) return
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    animationEngine.stop()
    await canvas.loadFromJSON(snapshot.fabricJSON)
    canvas.renderAll()

    const restoredObjects = JSON.parse(snapshot.objectsJSON)
    setObjects(restoredObjects)

    canvas.discardActiveObject()
    canvas.renderAll()
  }, [setObjects])

  const handleUndo = useCallback(async () => {
    await applySnapshot(undo())
  }, [applySnapshot, undo])

  const handleRedo = useCallback(async () => {
    await applySnapshot(redo())
  }, [applySnapshot, redo])

  // Charger le projet depuis localStorage au démarrage
  useEffect(() => {
    if (!fabricReady || !fabricCanvasRef.current) return

    const projet = loadFromLocalStorage()
    if (projet) {
      deserializeProject(
        projet,
        fabricCanvasRef.current,
        setObjects,
        setTracks,
        (name, format) => {
          setProjectName(name)
          setActiveFormat(format)
        }
      ).then(() => {
        setTimeout(captureSnapshot, 100)  // snapshot initial après chargement
      }).catch((err) => {
        console.warn('[MotionStudio] Impossible de restaurer le projet:', err)
        setTimeout(captureSnapshot, 100)
      })
    } else {
      setTimeout(captureSnapshot, 100)  // snapshot initial projet vide
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricReady])

  // Synchroniser les pistes d'animation avec le moteur
  useEffect(() => {
    animationEngine.setTracks(tracks)
  }, [tracks])

  // Synchroniser la durée avec le moteur
  useEffect(() => {
    animationEngine.setDuration(duration)
  }, [duration])

  // Callback tick du moteur → mise à jour du store
  useEffect(() => {
    const onTick = (t: number) => {
      setCurrentTime(t)
      if (t >= duration) {
        setIsPlaying(false)
      }
    }
    animationEngine.onTick(onTick)
    return () => animationEngine.offTick(onTick)
  }, [duration, setCurrentTime, setIsPlaying])

  // Autosave toutes les 30 secondes si isDirty
  useEffect(() => {
    if (!fabricReady) return

    const stopAutosave = startAutosave(
      () => {
        if (!fabricCanvasRef.current) {
          // Retourner un projet minimal si le canvas n'est pas prêt
          return {
            id: 'temp',
            name: projectName,
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            duration,
            fps,
            format: activeFormat,
            canvas: { width: activeFormat.width, height: activeFormat.height, backgroundColor: '#1a1f2e' },
            objects: useObjectStore.getState().objects,
            fabricJSON: {},
            timeline: tracks,
          }
        }
        return serializeProject(
          fabricCanvasRef.current,
          {
            objects: useObjectStore.getState().objects,
            tracks,
            ui: { projectName, activeFormat },
          },
          { duration, fps }
        )
      },
      () => isDirty
    )

    return stopAutosave
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricReady, isDirty])

  // ── Split Clip ───────────────────────────────────────────────────────────
  const handleSplit = useCallback((objectId: string, splitTime: number) => {
    const { objects } = useObjectStore.getState()
    const obj = objects.find((o) => o.id === objectId)
    if (!obj) return

    const currentTracks   = useTimelineStore.getState().tracks
    const currentDuration = useTimelineStore.getState().duration

    const result = splitClip(obj, splitTime, currentTracks, currentDuration)
    if (!result) return

    const canvas = fabricCanvasRef.current
    if (!canvas) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const srcFabricObj = canvas.getObjects().find((o) => (o as any).motionId === objectId)

    const commitSplit = (newFabricObjOrNull: unknown) => {
      if (newFabricObjOrNull) canvas.add(newFabricObjOrNull as Parameters<typeof canvas.add>[0])

      updateObject(objectId, result.originalPatch)
      addObject(result.newObject)

      const updatedTracks = currentTracks.map((t) => {
        const upd = result.tracksToUpdate.find((u) => u.id === t.id)
        return upd ? { ...t, keyframes: upd.keyframes } : t
      })
      setTracks([...updatedTracks, ...result.newTracks])

      setTimelineMode('select')
      setDirty(true)
      setTimeout(captureSnapshot, 50)
    }

    if (obj.type === 'video' && srcFabricObj) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalVideoEl = (srcFabricObj as any)._videoEl as HTMLVideoElement | undefined

      if (originalVideoEl) {
        const videoOffset = splitTime - (obj.startTime ?? 0)

        // Créer un élément <video> indépendant avec la même source
        const clonedVideoEl = document.createElement('video')
        clonedVideoEl.src         = originalVideoEl.src
        clonedVideoEl.muted       = true
        clonedVideoEl.playsInline = true
        clonedVideoEl.loop        = false
        clonedVideoEl.preload     = 'auto'

        clonedVideoEl.addEventListener('loadeddata', () => {
          clonedVideoEl.currentTime = videoOffset
          clonedVideoEl.pause()

          const vw = originalVideoEl.videoWidth  || 640
          const vh = originalVideoEl.videoHeight || 360

          // Canvas offscreen — même pattern que handleVideoInput dans CanvasEditor
          const offscreen    = document.createElement('canvas')
          offscreen.width    = vw
          offscreen.height   = vh
          const ctx          = offscreen.getContext('2d')!

          // Dessiner la frame de départ (évite le rectangle vide)
          if (clonedVideoEl.readyState >= 2) {
            ctx.drawImage(clonedVideoEl, 0, 0, vw, vh)
          }

          const rightFabricObj = new FabricImage(
            offscreen as unknown as HTMLImageElement,
            {
              left:   srcFabricObj.left   ?? 50,
              top:    srcFabricObj.top    ?? 50,
              scaleX: srcFabricObj.scaleX ?? 1,
              scaleY: srcFabricObj.scaleY ?? 1,
              selectable:  true,
              evented:     true,
              hasControls: true,
              hasBorders:  true,
            }
          )
          rightFabricObj.objectCaching = false

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(rightFabricObj as any).motionId   = result.newObject.id
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(rightFabricObj as any)._videoEl   = clonedVideoEl
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(rightFabricObj as any)._offscreen = offscreen
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(rightFabricObj as any)._ctx       = ctx

          // Invisible jusqu'à ce que le scrubber entre dans sa plage
          rightFabricObj.visible = false

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(rightFabricObj as any)._stopRenderLoop = () => {
            clonedVideoEl.pause()
            // Ne pas révoquer l'URL : partagée avec le clip gauche
          }

          commitSplit(rightFabricObj)
        }, { once: true })

        clonedVideoEl.load()
        return
      }
    }

    // Types non-vidéo : clone Fabric générique (async ignoré — on n'attend pas)
    srcFabricObj?.clone().then((cloned) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(cloned as any).motionId = result.newObject.id
      commitSplit(cloned)
    }) ?? commitSplit(null)
  }, [updateObject, addObject, setTracks, setTimelineMode, setDirty, captureSnapshot])

  // ── Raccourcis clavier Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z / S ───────────────
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' ||
                        !!(document.activeElement as HTMLElement)?.isContentEditable
      if (isEditing) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        await handleUndo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        await handleRedo()
      } else if (!e.ctrlKey && !e.metaKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        const currentMode = useUIStore.getState().timelineMode
        setTimelineMode(currentMode === 'split' ? 'select' : 'split')
      } else if (e.key === 'Escape') {
        setTimelineMode('select')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo, handleRedo, setTimelineMode])

  // Import audio — écouter le CustomEvent de la Toolbar
  useEffect(() => {
    const handleAudioInput = async (e: Event) => {
      const file = (e as CustomEvent<File>).detail
      if (!file) return

      try {
        const id = crypto.randomUUID()

        // Décoder complètement en mémoire via Web Audio API — zéro grésillements
        const audioDuration = await audioManager.loadFile(id, file, 0)
        const timelineDur   = useTimelineStore.getState().duration
        const endTime       = Math.min(audioDuration, timelineDur)

        addObject({
          id,
          fabricId:  '',
          name:      file.name.replace(/\.[^.]+$/, ''),
          type:      'audio',
          visible:   true,
          locked:    false,
          startTime: 0,
          endTime,
          volume:    1,
          muted:     false,
        })
        selectObject(id)
        setDirty(true)
        captureSnapshot()
      } catch (err) {
        console.error('[MotionStudio] Audio import échoué:', err)
        alert(`Impossible de charger le fichier audio : ${file.name}`)
      }
    }

    window.addEventListener('motionstudio:audio-input', handleAudioInput as EventListener)
    return () => window.removeEventListener('motionstudio:audio-input', handleAudioInput as EventListener)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.app}>
      {/* Barre supérieure */}
      <div className={styles.topBar}>
        <ProjectManager fabricCanvas={fabricCanvasRef.current} />
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Toolbar />
      </div>

      {/* Canvas */}
      <div className={styles.canvas}>
        <CanvasEditor onCanvasReady={handleCanvasReady} onCapture={captureSnapshot} />
      </div>

      {/* Inspector */}
      <div className={styles.inspector}>
        <Inspector fabricCanvas={fabricCanvasRef.current} />
      </div>

      {/* Contrôles de lecture */}
      <div className={styles.playback}>
        <PlaybackControls />
      </div>

      {/* Timeline — reçoit le ref du canvas pour synchroniser les suppressions */}
      <div className={styles.timeline}>
        <Timeline
          fabricRef={fabricCanvasRef}
          onCapture={captureSnapshot}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSplit={handleSplit}
        />
      </div>

    </div>
  )
}
