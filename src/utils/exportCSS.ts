// Génération de CSS @keyframes exportable depuis les tracks du projet
import { Project, AnimationTrack } from '../types'

export function generateCSSKeyframes(project: Project): string {
  const lines: string[] = []

  lines.push(`/* Animation générée par MotionStudio */`)
  lines.push(`/* Projet : ${project.name} — Durée : ${project.duration}s */`)
  lines.push(``)

  // Grouper les tracks par objet
  const tracksByObject = new Map<string, AnimationTrack[]>()
  project.timeline.forEach((track) => {
    const existing = tracksByObject.get(track.objectId) ?? []
    existing.push(track)
    tracksByObject.set(track.objectId, existing)
  })

  tracksByObject.forEach((tracks, objectId) => {
    const obj = project.objects.find((o) => o.id === objectId)
    if (!obj) return

    const name     = obj.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase() || `obj-${objectId.slice(0, 6)}`
    const animName = `motion-${name}`

    // Collecter tous les pourcentages
    const timeMap = new Map<number, Record<string, number>>()
    tracks.forEach((track) => {
      track.keyframes.forEach((kf) => {
        const existing = timeMap.get(kf.time) ?? {}
        existing[track.property] = kf.value as number
        timeMap.set(kf.time, existing)
      })
    })

    if (timeMap.size === 0) return

    lines.push(`/* ${obj.name} */`)
    lines.push(`@keyframes ${animName} {`)

    const times = [...timeMap.keys()].sort((a, b) => a - b)
    times.forEach((time) => {
      const pct        = ((time / project.duration) * 100).toFixed(1)
      const props      = timeMap.get(time)!
      const transforms: string[] = []
      const styleProps: string[] = []

      if (props.x      !== undefined) transforms.push(`translateX(${Math.round(props.x)}px)`)
      if (props.y      !== undefined) transforms.push(`translateY(${Math.round(props.y)}px)`)
      if (props.scaleX !== undefined) transforms.push(`scaleX(${props.scaleX.toFixed(3)})`)
      if (props.scaleY !== undefined) transforms.push(`scaleY(${props.scaleY.toFixed(3)})`)
      if (props.angle  !== undefined) transforms.push(`rotate(${Math.round(props.angle)}deg)`)
      if (props.opacity !== undefined) styleProps.push(`opacity: ${(props.opacity / 100).toFixed(2)}`)

      lines.push(`  ${pct}% {`)
      if (transforms.length > 0) lines.push(`    transform: ${transforms.join(' ')};`)
      styleProps.forEach((s) => lines.push(`    ${s};`))
      lines.push(`  }`)
    })

    lines.push(`}`)
    lines.push(``)

    // Classe CSS d'application
    lines.push(`.${name} {`)
    lines.push(`  animation: ${animName} ${project.duration}s forwards;`)
    lines.push(`}`)
    lines.push(``)
  })

  return lines.join('\n')
}
