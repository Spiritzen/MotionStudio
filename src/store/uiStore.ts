// Store Zustand — état de l'interface utilisateur
import { create } from 'zustand'
import { CanvasFormat, CANVAS_FORMATS } from '../types'

export type ActiveTool = 'select' | 'rect' | 'text' | 'image' | 'circle' | 'video'

interface UIState {
  activeTool: ActiveTool
  projectName: string
  isDirty: boolean          // modifications non sauvegardées
  activeFormat: CanvasFormat
  inspectorRefreshKey: number  // incrémenter pour forcer le re-render de l'Inspector
  canvasZoom: number           // pourcentage : 10–200, ou 0 = fit automatique
  // Actions
  setActiveTool: (tool: ActiveTool) => void
  setProjectName: (name: string) => void
  setDirty: (val: boolean) => void
  setActiveFormat: (format: CanvasFormat) => void
  forceInspectorUpdate: () => void
  setCanvasZoom: (zoom: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: 'select',
  projectName: 'Nouveau projet',
  isDirty: false,
  activeFormat: CANVAS_FORMATS[0], // YouTube 16:9 par défaut
  inspectorRefreshKey: 0,
  canvasZoom: 0,                   // 0 = mode fit au démarrage

  setActiveTool: (tool) => set({ activeTool: tool }),
  setProjectName: (name) => set({ projectName: name }),
  setDirty: (val) => set({ isDirty: val }),
  setActiveFormat: (format) => set({ activeFormat: format }),
  forceInspectorUpdate: () => set((s) => ({ inspectorRefreshKey: s.inspectorRefreshKey + 1 })),
  setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
}))
