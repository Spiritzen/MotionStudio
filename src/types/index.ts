// Types principaux de MotionStudio

export interface MotionObject {
  id: string
  fabricId: string
  name: string
  type: 'rect' | 'circle' | 'text' | 'image' | 'video' | 'audio' | 'group'
  visible: boolean
  locked: boolean
  startTime?: number  // secondes — défaut 0
  endTime?: number    // secondes — défaut = durée totale
  volume?: number      // 0–1 — défaut 1 (vidéo et audio uniquement)
  muted?: boolean      // défaut false
  videoOffset?: number // offset en secondes dans le fichier vidéo (après split)
}

export interface Keyframe {
  id: string
  time: number        // en secondes
  value: number | string
  easing: string      // ex: "power2.out"
}

export interface AnimationTrack {
  id: string
  objectId: string
  property: 'x' | 'y' | 'opacity' | 'scaleX' | 'scaleY' | 'angle'
  keyframes: Keyframe[]
}

export interface CanvasFormat {
  id: string
  name: string
  width: number
  height: number
  label: string       // ex: "YouTube 16:9", "TikTok 9:16"
}

export interface MediaCacheEntry {
  type:     'video' | 'image' | 'audio'
  dataUrl:  string      // base64 data URL
  mimeType: string
  filename: string
}

export interface Project {
  id: string
  name: string
  version: string     // ex: "1.0.0"
  createdAt: string
  updatedAt: string
  duration: number    // en secondes
  fps: number
  format: CanvasFormat
  canvas: {
    width: number
    height: number
    backgroundColor: string
  }
  objects: MotionObject[]
  fabricJSON: object  // snapshot Fabric.js complet via canvas.toJSON()
  timeline: AnimationTrack[]
  mediaCache?: Record<string, MediaCacheEntry>  // médias embarqués en base64
}

// Formats prédéfinis disponibles dans l'app
export const CANVAS_FORMATS: CanvasFormat[] = [
  { id: 'youtube-169',   name: 'YouTube',          width: 1280, height: 720,  label: 'YouTube 16:9' },
  { id: 'youtube-short', name: 'YouTube Short',    width: 1080, height: 1920, label: 'YouTube Short 9:16' },
  { id: 'tiktok',        name: 'TikTok',           width: 1080, height: 1920, label: 'TikTok 9:16' },
  { id: 'instagram-sq',  name: 'Instagram carré',  width: 1080, height: 1080, label: 'Instagram 1:1' },
  { id: 'instagram-st',  name: 'Instagram story',  width: 1080, height: 1920, label: 'Instagram Story 9:16' },
  { id: 'twitter',       name: 'Twitter/X',        width: 1280, height: 720,  label: 'Twitter/X 16:9' },
  { id: 'linkedin',      name: 'LinkedIn',         width: 1200, height: 627,  label: 'LinkedIn 1.91:1' },
  { id: 'custom',        name: 'Personnalisé',     width: 1920, height: 1080, label: 'Personnalisé' },
]
