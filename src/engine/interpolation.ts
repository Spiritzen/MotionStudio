// Calcul de l'interpolation entre keyframes avec easing GSAP
import gsap from 'gsap'
import { AnimationTrack } from '../types'

export function interpolateValue(
  tracks:   AnimationTrack[],
  objectId: string,
  property: string,
  time:     number
): number | null {
  const track = tracks.find(
    (t) => t.objectId === objectId && t.property === property
  )
  if (!track || track.keyframes.length === 0) return null

  const sorted = [...track.keyframes].sort((a, b) => a.time - b.time)

  if (time <= sorted[0].time) return sorted[0].value as number
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value as number

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]

    if (time >= a.time && time <= b.time) {
      const duree = b.time - a.time
      if (duree === 0) return b.value as number

      const t = (time - a.time) / duree

      // Appliquer l'easing GSAP du keyframe de destination
      let easedT = t
      const easingName = b.easing ?? 'linear'
      try {
        const easeFn = gsap.parseEase(easingName)
        if (typeof easeFn === 'function') easedT = easeFn(t)
      } catch {
        // fallback linéaire silencieux
      }

      return (a.value as number) + easedT * ((b.value as number) - (a.value as number))
    }
  }

  return null
}
