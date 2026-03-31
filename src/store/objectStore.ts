// Store Zustand — gestion des objets sur le canvas
import { create } from 'zustand'
import { MotionObject } from '../types'

interface ObjectState {
  objects: MotionObject[]
  selectedObjectId: string | null
  // Actions
  addObject: (obj: MotionObject) => void
  removeObject: (id: string) => void
  updateObject: (id: string, patch: Partial<MotionObject>) => void
  updateClip: (id: string, startTime: number, endTime: number) => void
  selectObject: (id: string | null) => void
  setObjects: (objects: MotionObject[]) => void
  reorderObjects: (draggedId: string, targetId: string) => void
}

export const useObjectStore = create<ObjectState>((set) => ({
  objects: [],
  selectedObjectId: null,

  addObject: (obj) =>
    set((state) => ({ objects: [...state.objects, obj] })),

  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((o) => o.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
    })),

  updateObject: (id, patch) =>
    set((state) => ({
      objects: state.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),

  updateClip: (id, startTime, endTime) =>
    set((state) => ({
      objects: state.objects.map((o) =>
        o.id === id ? { ...o, startTime, endTime } : o
      ),
    })),

  selectObject: (id) => set({ selectedObjectId: id }),

  setObjects: (objects) => set({ objects }),

  reorderObjects: (draggedId, targetId) =>
    set((state) => {
      const arr = [...state.objects]
      const fromIdx = arr.findIndex((o) => o.id === draggedId)
      const toIdx = arr.findIndex((o) => o.id === targetId)
      if (fromIdx === -1 || toIdx === -1) return state
      const [moved] = arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, moved)
      return { objects: arr }
    }),
}))
