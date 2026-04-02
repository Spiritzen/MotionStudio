// Génération de code GSAP exportable depuis les tracks du projet
import { Project, AnimationTrack } from '../types'

export function generateGSAPCode(project: Project): string {
  const lines: string[] = []

  lines.push(`// Animation générée par MotionStudio`)
  lines.push(`// Projet : ${project.name}`)
  lines.push(`// Durée : ${project.duration}s`)
  lines.push(``)
  lines.push(`import gsap from 'gsap'`)
  lines.push(``)
  lines.push(`const tl = gsap.timeline()`)
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

    const varName = obj.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') || `obj_${objectId.slice(0, 6)}`
    lines.push(`// ── ${obj.name} ──────────────────────────`)
    lines.push(`const ${varName} = document.getElementById('${varName}')`)
    lines.push(``)

    // Collecter tous les instants uniques avec leurs valeurs
    const timeMap = new Map<number, Record<string, number>>()

    tracks.forEach((track) => {
      const sorted = [...track.keyframes].sort((a, b) => a.time - b.time)
      sorted.forEach((kf) => {
        const existing = timeMap.get(kf.time) ?? {}
        existing[track.property] = kf.value as number
        timeMap.set(kf.time, existing)
      })
    })

    const times = [...timeMap.keys()].sort((a, b) => a - b)

    times.forEach((time, i) => {
      const props    = timeMap.get(time)!
      const prevTime = i > 0 ? times[i - 1] : 0
      const duration = time - prevTime
      const ease     = getEaseForTime(tracks, time)

      const gsapProps: Record<string, string | number> = {}
      if (props.x       !== undefined) gsapProps.x        = Math.round(props.x)
      if (props.y       !== undefined) gsapProps.y        = Math.round(props.y)
      if (props.opacity !== undefined) gsapProps.opacity  = +(props.opacity / 100).toFixed(2)
      if (props.scaleX  !== undefined) gsapProps.scaleX   = +props.scaleX.toFixed(3)
      if (props.scaleY  !== undefined) gsapProps.scaleY   = +props.scaleY.toFixed(3)
      if (props.angle   !== undefined) gsapProps.rotation = Math.round(props.angle)

      if (Object.keys(gsapProps).length === 0) return

      const propsStr = Object.entries(gsapProps)
        .map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`)
        .join(', ')

      if (i === 0) {
        // Premier keyframe → gsap.set()
        lines.push(`gsap.set(${varName}, { ${propsStr} })`)
      } else {
        // Keyframes suivants → tl.to()
        lines.push(`tl.to(${varName}, {`)
        lines.push(`  ${propsStr},`)
        lines.push(`  duration: ${duration.toFixed(2)},`)
        lines.push(`  ease: '${ease}',`)
        lines.push(`}, ${prevTime.toFixed(2)})`)
      }
    })
    lines.push(``)
  })

  return lines.join('\n')
}

// Trouver l'easing dominant pour un instant donné
function getEaseForTime(tracks: AnimationTrack[], time: number): string {
  for (const track of tracks) {
    const kf = track.keyframes.find((k) => k.time === time)
    if (kf?.easing) return kf.easing
  }
  return 'power2.out'
}
