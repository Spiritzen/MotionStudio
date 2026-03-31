// Sérialisation / désérialisation complète du projet
import { Canvas as FabricCanvas } from 'fabric'
import { Project, MotionObject, AnimationTrack, CanvasFormat } from '../types'
import { generateId } from './generateId'

interface SerializeStores {
  objects: MotionObject[]
  tracks: AnimationTrack[]
  ui: { projectName: string; activeFormat: CanvasFormat }
}

interface SerializeMeta {
  duration: number
  fps: number
}

// Sérialise l'état complet (canvas Fabric + stores) en objet Project
export function serializeProject(
  fabricCanvas: FabricCanvas,
  stores: SerializeStores,
  meta: SerializeMeta
): Project {
  const now = new Date().toISOString()
  const format = stores.ui.activeFormat

  return {
    id: generateId(),
    name: stores.ui.projectName,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    duration: meta.duration,
    fps: meta.fps,
    format,
    canvas: {
      width: format.width,
      height: format.height,
      backgroundColor: (fabricCanvas.backgroundColor as string) || '#1a1f2e',
    },
    objects: stores.objects,
    fabricJSON: fabricCanvas.toJSON(),
    timeline: stores.tracks,
  }
}

// Restaure l'état complet depuis un objet Project
export async function deserializeProject(
  project: Project,
  fabricCanvas: FabricCanvas,
  setObjects: (objects: MotionObject[]) => void,
  setTracks: (tracks: AnimationTrack[]) => void,
  setUi: (name: string, format: CanvasFormat) => void
): Promise<void> {
  // Restaure le canvas Fabric depuis le snapshot JSON
  await fabricCanvas.loadFromJSON(project.fabricJSON)
  fabricCanvas.setDimensions({ width: project.canvas.width, height: project.canvas.height })
  fabricCanvas.backgroundColor = project.canvas.backgroundColor
  fabricCanvas.renderAll()

  // Restaure les stores
  setObjects(project.objects)
  setTracks(project.timeline)
  setUi(project.name, project.format)
}
