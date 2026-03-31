// Utilitaires pour manipuler les keyframes
import { Keyframe } from '../types'

// Trie les keyframes par temps croissant
export function sortKeyframes(keyframes: Keyframe[]): Keyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time)
}

// Trouve les deux keyframes encadrant un instant t
export function getNeighborKeyframes(
  keyframes: Keyframe[],
  time: number
): { before: Keyframe | null; after: Keyframe | null } {
  const sorted = sortKeyframes(keyframes)

  let before: Keyframe | null = null
  let after: Keyframe | null = null

  for (const kf of sorted) {
    if (kf.time <= time) before = kf
    else if (after === null) after = kf
  }

  return { before, after }
}

// Vérifie si un keyframe existe déjà à cet instant (tolérance 0.01s)
export function keyframeExistsAt(keyframes: Keyframe[], time: number): boolean {
  return keyframes.some((kf) => Math.abs(kf.time - time) < 0.01)
}

// Retourne le keyframe le plus proche d'un instant t
export function getNearestKeyframe(
  keyframes: Keyframe[],
  time: number
): Keyframe | null {
  if (keyframes.length === 0) return null
  return keyframes.reduce((proche, kf) =>
    Math.abs(kf.time - time) < Math.abs(proche.time - time) ? kf : proche
  )
}
