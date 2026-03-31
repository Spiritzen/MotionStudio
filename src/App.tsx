// App.tsx — layout principal de MotionStudio
import { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas as FabricCanvas } from 'fabric'
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
import styles from './App.module.css'

export default function App() {
  const fabricCanvasRef = useRef<FabricCanvas | null>(null)
  const [fabricReady, setFabricReady] = useState(false)

  const { setObjects, addObject, selectObject } = useObjectStore()
  const { pushSnapshot, undo, redo } = useHistoryStore()
  const { tracks, setTracks, setCurrentTime, setIsPlaying, duration, fps } = useTimelineStore()
  const { projectName, isDirty, activeFormat, setActiveFormat, setProjectName, setDirty } = useUIStore()

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

  // ── Raccourcis clavier Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z ──────────────────
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
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo, handleRedo])

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
        />
      </div>

    </div>
  )
}
