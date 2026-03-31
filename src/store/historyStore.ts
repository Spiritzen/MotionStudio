// Store Zustand — historique undo/redo
import { create } from 'zustand'

export interface HistorySnapshot {
  fabricJSON:  object  // snapshot complet du canvas Fabric
  objectsJSON: string  // snapshot des MotionObjects (JSON stringifié)
  tracksJSON:  string  // snapshot des AnimationTracks (JSON stringifié)
}

interface HistoryStore {
  past:   HistorySnapshot[]
  future: HistorySnapshot[]

  pushSnapshot: (snapshot: HistorySnapshot) => void
  undo: () => HistorySnapshot | null
  redo: () => HistorySnapshot | null
  clear: () => void

  canUndo: () => boolean
  canRedo: () => boolean
}

const MAX_HISTORY = 50

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past:   [],
  future: [],

  pushSnapshot: (snapshot) => {
    set((state) => ({
      past:   [...state.past.slice(-(MAX_HISTORY - 1)), snapshot],
      future: [],  // toute nouvelle action efface le redo
    }))
  },

  undo: () => {
    const { past, future } = get()
    if (past.length < 2) return null  // garder au moins l'état initial

    const previous = past[past.length - 2]
    const current  = past[past.length - 1]

    set({
      past:   past.slice(0, -1),
      future: [current, ...future],
    })

    return previous
  },

  redo: () => {
    const { past, future } = get()
    if (future.length === 0) return null

    const next = future[0]

    set({
      past:   [...past, next],
      future: future.slice(1),
    })

    return next
  },

  clear: () => set({ past: [], future: [] }),

  canUndo: () => get().past.length >= 2,
  canRedo: () => get().future.length > 0,
}))
