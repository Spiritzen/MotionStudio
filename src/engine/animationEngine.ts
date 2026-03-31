// Moteur d'animation principal — RAF loop + contrôle vidéo + audio
import gsap from 'gsap'
import { Canvas as FabricCanvas, FabricObject } from 'fabric'
import { AnimationTrack, MotionObject } from '../types'
import { interpolateValue } from './interpolation'
import { audioManager } from './audioManager'
import { useObjectStore } from '../store/objectStore'

// Propriétés animables avec leur correspondance Fabric.js
type AnimatableProperty = 'x' | 'y' | 'opacity' | 'scaleX' | 'scaleY' | 'angle'

interface EngineState {
  fabricCanvas: FabricCanvas | null
  tracks: AnimationTrack[]
  currentTime: number
  duration: number
  isPlaying: boolean
  gsapTimeline: gsap.core.Timeline | null
  tickCallbacks: Array<(time: number) => void>
  rafId: number | null
  startWallTime: number
  startAnimTime: number
}

const state: EngineState = {
  fabricCanvas: null,
  tracks: [],
  currentTime: 0,
  duration: 10,
  isPlaying: false,
  gsapTimeline: null,
  tickCallbacks: [],
  rafId: null,
  startWallTime: 0,
  startAnimTime: 0,
}

// ─── Helpers vidéo ──────────────────────────────────────────────────────────

/** Associe chaque videoEl Fabric à son MotionObject du store */
function getAllVideoObjectPairs(): Array<{ videoEl: HTMLVideoElement; motionObj: MotionObject }> {
  if (!state.fabricCanvas) return []
  const motionObjects = useObjectStore.getState().objects

  return state.fabricCanvas
    .getObjects()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((obj) => !!(obj as any)._videoEl)
    .map((obj) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      videoEl:   (obj as any)._videoEl as HTMLVideoElement,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      motionObj: motionObjects.find((mo) => mo.id === (obj as any).motionId),
    }))
    .filter(
      (pair): pair is { videoEl: HTMLVideoElement; motionObj: MotionObject } =>
        pair.motionObj !== undefined
    )
}

// Applique les valeurs interpolées sur les objets Fabric au temps t
function applyStateAtTime(time: number): void {
  if (!state.fabricCanvas) return

  const objects = state.fabricCanvas.getObjects() as FabricObject[]

  for (const obj of objects) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const motionId = (obj as any).motionId as string | undefined
    if (!motionId) continue

    const properties: AnimatableProperty[] = ['x', 'y', 'opacity', 'scaleX', 'scaleY', 'angle']

    for (const prop of properties) {
      const valeur = interpolateValue(state.tracks, motionId, prop, time)
      if (valeur === null) continue

      if (typeof valeur === 'number') {
        if (prop === 'x') obj.set('left', valeur)
        else if (prop === 'y') obj.set('top', valeur)
        else obj.set(prop as keyof FabricObject, valeur as never)
      }
    }

    obj.setCoords()
  }

  state.fabricCanvas.renderAll()
}

// Boucle de rendu via requestAnimationFrame
function rafLoop(): void {
  if (!state.isPlaying) return

  const elapsed = (performance.now() - state.startWallTime) / 1000
  const newTime = Math.min(state.startAnimTime + elapsed, state.duration)
  state.currentTime = newTime

  // Synchroniser les vidéos selon leur plage de clip
  getAllVideoObjectPairs().forEach(({ videoEl, motionObj }) => {
    const startTime = motionObj.startTime ?? 0
    const endTime   = motionObj.endTime   ?? state.duration
    const inRange   = newTime >= startTime && newTime < endTime

    if (inRange && videoEl.paused) {
      videoEl.currentTime = newTime - startTime
      videoEl.muted       = motionObj.muted  ?? false
      videoEl.volume      = motionObj.volume ?? 1
      videoEl.play().catch(console.warn)
    } else if (!inRange && !videoEl.paused) {
      videoEl.pause()
      videoEl.muted = true  // reset mute hors plage
    }
  })

  // Synchroniser l'audio (entrée/sortie de plage automatique)
  audioManager.syncToTime(newTime)

  applyStateAtTime(newTime)
  for (const cb of state.tickCallbacks) cb(newTime)

  if (newTime >= state.duration) {
    // Fin de la lecture — arrêt propre
    state.isPlaying = false
    state.currentTime = state.duration
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId)
      state.rafId = null
    }
    getAllVideoObjectPairs().forEach(({ videoEl }) => { videoEl.pause(); videoEl.muted = true })
    audioManager.stopAll()
    for (const cb of state.tickCallbacks) cb(state.duration)
    return
  }

  state.rafId = requestAnimationFrame(rafLoop)
}

export const animationEngine = {
  // Initialise le moteur avec le canvas Fabric
  init(fabricCanvas: FabricCanvas): void {
    state.fabricCanvas = fabricCanvas
  },

  // Démarre la lecture depuis currentTime
  play(): void {
    if (state.isPlaying) return

    if (state.currentTime >= state.duration) {
      state.currentTime = 0
    }

    state.isPlaying = true
    state.startWallTime = performance.now()
    state.startAnimTime = state.currentTime

    // Démarrer les vidéos dans leur plage — unmute via geste utilisateur (clic Play)
    getAllVideoObjectPairs().forEach(({ videoEl, motionObj }) => {
      const startTime = motionObj.startTime ?? 0
      const endTime   = motionObj.endTime   ?? state.duration
      const t         = state.currentTime

      if (t >= startTime && t < endTime) {
        videoEl.currentTime = t - startTime
        videoEl.muted       = motionObj.muted  ?? false
        videoEl.volume      = motionObj.volume ?? 1
        videoEl.play().catch(console.warn)
      }
    })

    audioManager.play(state.currentTime)
    state.rafId = requestAnimationFrame(rafLoop)
  },

  // Met en pause et met à jour currentTime
  pause(): void {
    state.isPlaying = false
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId)
      state.rafId = null
    }
    // NE PAS remuter — garder l'état mute de la piste
    getAllVideoObjectPairs().forEach(({ videoEl }) => videoEl.pause())
    audioManager.pause()
  },

  // Remet à zéro et arrête la lecture
  stop(): void {
    state.isPlaying = false
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId)
      state.rafId = null
    }
    state.currentTime = 0
    getAllVideoObjectPairs().forEach(({ videoEl }) => {
      videoEl.pause()
      videoEl.currentTime = 0
      videoEl.muted = true  // remuter proprement au stop
    })
    audioManager.stopAll()
    applyStateAtTime(0)
    for (const cb of state.tickCallbacks) cb(0)
  },

  // Scrub vers un moment précis
  seek(time: number): void {
    const t = Math.max(0, Math.min(time, state.duration))
    state.currentTime = t
    state.startAnimTime = t
    state.startWallTime = performance.now()

    getAllVideoObjectPairs().forEach(({ videoEl, motionObj }) => {
      videoEl.pause()
      const startTime = motionObj.startTime ?? 0
      const endTime   = motionObj.endTime   ?? state.duration
      if (t >= startTime && t < endTime) {
        videoEl.currentTime = t - startTime
      }
    })

    audioManager.seekAll(t)
    applyStateAtTime(t)

    // Reprendre si en lecture
    if (state.isPlaying) {
      getAllVideoObjectPairs().forEach(({ videoEl, motionObj }) => {
        const startTime = motionObj.startTime ?? 0
        const endTime   = motionObj.endTime   ?? state.duration
        if (t >= startTime && t < endTime) {
          videoEl.muted  = motionObj.muted  ?? false
          videoEl.volume = motionObj.volume ?? 1
          videoEl.play().catch(console.warn)
        }
      })
      audioManager.play(t)
    }

    for (const cb of state.tickCallbacks) cb(t)
  },

  // Met à jour les pistes d'animation
  setTracks(tracks: AnimationTrack[]): void {
    state.tracks = tracks
  },

  // Met à jour la durée totale
  setDuration(duration: number): void {
    state.duration = duration
  },

  // Abonne un callback appelé à chaque tick
  onTick(callback: (time: number) => void): void {
    state.tickCallbacks.push(callback)
  },

  // Retire un callback
  offTick(callback: (time: number) => void): void {
    state.tickCallbacks = state.tickCallbacks.filter((cb) => cb !== callback)
  },

  // Récupère le temps actuel
  getCurrentTime(): number {
    return state.currentTime
  },

  // Libère les ressources
  dispose(): void {
    animationEngine.pause()
    state.fabricCanvas = null
    state.tracks = []
    state.tickCallbacks = []
    if (state.gsapTimeline) {
      state.gsapTimeline.kill()
      state.gsapTimeline = null
    }
    gsap.killTweensOf('*')
  },
}
