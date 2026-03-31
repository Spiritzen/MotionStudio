// Logique de découpe de clip + interpolation des keyframes
import { MotionObject, AnimationTrack, Keyframe } from '../types'
import { generateId } from './generateId'

/** Interpolation linéaire d'une valeur à un instant t dans une liste de keyframes triés */
function interpolateValue(keyframes: Keyframe[], time: number): number | string {
  if (keyframes.length === 0) return 0
  const sorted = [...keyframes].sort((a, b) => a.time - b.time)

  if (time <= sorted[0].time) return sorted[0].value
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value

  let before = sorted[0]
  let after  = sorted[sorted.length - 1]
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].time <= time && sorted[i + 1].time >= time) {
      before = sorted[i]
      after  = sorted[i + 1]
      break
    }
  }

  if (typeof before.value === 'string' || typeof after.value === 'string') return before.value

  const ratio = (time - before.time) / (after.time - before.time)
  return before.value + ratio * (after.value - before.value)
}

export interface SplitResult {
  /** Patch à appliquer à l'objet d'origine (raccourcir à splitTime) */
  originalPatch: Partial<MotionObject>
  /** Nouvel objet (2e moitié du clip) */
  newObject: MotionObject
  /** Nouvelles pistes animation pour le nouvel objet */
  newTracks: AnimationTrack[]
  /** Pistes d'animation de l'original à mettre à jour (keyframes tronqués) */
  tracksToUpdate: { id: string; keyframes: Keyframe[] }[]
}

/**
 * Découpe un clip en deux au temps splitTime.
 * Retourne null si splitTime est en dehors de [startTime, endTime].
 */
export function splitClip(
  obj: MotionObject,
  splitTime: number,
  tracks: AnimationTrack[],
  duration: number
): SplitResult | null {
  const startTime = obj.startTime ?? 0
  const endTime   = obj.endTime   ?? duration

  // splitTime doit être strictement à l'intérieur du clip
  if (splitTime <= startTime + 0.05 || splitTime >= endTime - 0.05) return null

  const offset = splitTime - startTime // décalage dans le fichier vidéo source

  // Nouvel objet : copie de l'original, de splitTime à endTime
  const newId = generateId()
  const newObject: MotionObject = {
    ...obj,
    id:          newId,
    name:        obj.name + ' (2)',
    startTime:   splitTime,
    endTime,
    videoOffset: (obj.videoOffset ?? 0) + offset,
  }

  // Patch original : raccourcir jusqu'à splitTime
  const originalPatch: Partial<MotionObject> = { endTime: splitTime }

  // Découper les pistes animation
  const newTracks: AnimationTrack[]                            = []
  const tracksToUpdate: { id: string; keyframes: Keyframe[] }[] = []

  const objTracks = tracks.filter((t) => t.objectId === obj.id)

  for (const track of objTracks) {
    const splitValue = interpolateValue(track.keyframes, splitTime)

    // Piste originale : KFs avant splitTime + KF-frontière
    const kfsBefore: Keyframe[] = track.keyframes.filter((kf) => kf.time < splitTime)
    const boundaryBefore: Keyframe = {
      id:     generateId(),
      time:   splitTime,
      value:  splitValue,
      easing: 'linear',
    }
    tracksToUpdate.push({
      id:        track.id,
      keyframes: [...kfsBefore, boundaryBefore].sort((a, b) => a.time - b.time),
    })

    // Nouvelle piste : KF-frontière + KFs après splitTime
    const kfsAfter: Keyframe[] = track.keyframes.filter((kf) => kf.time > splitTime)
    const boundaryAfter: Keyframe = {
      id:     generateId(),
      time:   splitTime,
      value:  splitValue,
      easing: 'linear',
    }
    newTracks.push({
      id:        generateId(),
      objectId:  newId,
      property:  track.property,
      keyframes: [boundaryAfter, ...kfsAfter].sort((a, b) => a.time - b.time),
    })
  }

  return { originalPatch, newObject, newTracks, tracksToUpdate }
}
