// Store Zustand — gestion de la timeline et des keyframes
import { create } from 'zustand'
import { AnimationTrack, Keyframe } from '../types'
import { generateId } from '../utils/generateId'

interface TimelineState {
  tracks: AnimationTrack[]
  currentTime: number       // en secondes (0 à duration)
  duration: number          // durée totale (défaut: 10)
  isPlaying: boolean
  fps: number               // défaut: 30
  // Actions
  addTrack: (objectId: string, property: AnimationTrack['property']) => void
  removeTrack: (id: string) => void
  removeTracksForObject: (objectId: string) => void
  addKeyframe: (trackId: string, keyframe: Omit<Keyframe, 'id'>) => void
  updateKeyframe: (trackId: string, kfId: string, patch: Partial<Keyframe>) => void
  deleteKeyframe: (trackId: string, kfId: string) => void
  setCurrentTime: (t: number) => void
  setIsPlaying: (val: boolean) => void
  setDuration: (val: number) => void
  setTracks: (tracks: AnimationTrack[]) => void
  insertTrack: (track: AnimationTrack) => void
}

export const useTimelineStore = create<TimelineState>((set) => ({
  tracks: [],
  currentTime: 0,
  duration: 10,
  isPlaying: false,
  fps: 30,

  addTrack: (objectId, property) =>
    set((state) => {
      // Éviter les doublons : une piste par (objectId, property)
      const existe = state.tracks.find(
        (t) => t.objectId === objectId && t.property === property
      )
      if (existe) return state
      const nouvellePiste: AnimationTrack = {
        id: generateId(),
        objectId,
        property,
        keyframes: [],
      }
      return { tracks: [...state.tracks, nouvellePiste] }
    }),

  removeTrack: (id) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== id),
    })),

  removeTracksForObject: (objectId) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.objectId !== objectId),
    })),

  addKeyframe: (trackId, keyframe) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              keyframes: [
                ...t.keyframes.filter((kf) => kf.time !== keyframe.time),
                { ...keyframe, id: generateId() },
              ].sort((a, b) => a.time - b.time),
            }
          : t
      ),
    })),

  updateKeyframe: (trackId, kfId, patch) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              keyframes: t.keyframes
                .map((kf) => (kf.id === kfId ? { ...kf, ...patch } : kf))
                .sort((a, b) => a.time - b.time),
            }
          : t
      ),
    })),

  deleteKeyframe: (trackId, kfId) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, keyframes: t.keyframes.filter((kf) => kf.id !== kfId) }
          : t
      ),
    })),

  setCurrentTime: (t) => set({ currentTime: Math.max(0, t) }),

  setIsPlaying: (val) => set({ isPlaying: val }),

  setDuration: (val) => set({ duration: Math.max(1, val) }),

  setTracks: (tracks) => set({ tracks }),

  insertTrack: (track) =>
    set((state) => ({
      tracks: [...state.tracks, track],
    })),
}))
