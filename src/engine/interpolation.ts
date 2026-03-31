// Calcul de l'interpolation entre keyframes
import { AnimationTrack } from '../types'

// Calcule la valeur interpolée d'une propriété à un instant t
// entre deux keyframes consécutifs
export function interpolateValue(
  tracks: AnimationTrack[],
  objectId: string,
  property: string,
  time: number
): number | string | null {
  const track = tracks.find(
    (t) => t.objectId === objectId && t.property === property
  )
  if (!track || track.keyframes.length === 0) return null

  const kfs = [...track.keyframes].sort((a, b) => a.time - b.time)

  // Avant le premier keyframe
  if (time <= kfs[0].time) return kfs[0].value

  // Après le dernier keyframe
  if (time >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value

  // Trouver les deux keyframes encadrants
  let avant = kfs[0]
  let apres = kfs[1]

  for (let i = 0; i < kfs.length - 1; i++) {
    if (time >= kfs[i].time && time <= kfs[i + 1].time) {
      avant = kfs[i]
      apres = kfs[i + 1]
      break
    }
  }

  const duree = apres.time - avant.time
  if (duree === 0) return apres.value

  // Ratio linéaire (0 → 1)
  const t = (time - avant.time) / duree

  // Interpolation numérique simple (linéaire)
  // Note : l'easing GSAP gère la courbe dans animationEngine
  if (typeof avant.value === 'number' && typeof apres.value === 'number') {
    return avant.value + (apres.value - avant.value) * t
  }

  // Valeur non numérique : retourner la valeur précédente
  return avant.value
}
