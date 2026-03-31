// Génération de code GSAP exportable depuis les tracks du projet
import { Project, AnimationTrack } from '../types'

// Génère du code GSAP lisible depuis les tracks du projet
export function generateGSAPCode(project: Project): string {
  const lines: string[] = []

  lines.push(`// Animation générée par MotionStudio`)
  lines.push(`// Projet : ${project.name}`)
  lines.push(`// Durée : ${project.duration}s — FPS : ${project.fps}`)
  lines.push(``)
  lines.push(`const tl = gsap.timeline();`)
  lines.push(``)

  // Regrouper les pistes par objet
  const parObjet = new Map<string, AnimationTrack[]>()
  for (const track of project.timeline) {
    if (!parObjet.has(track.objectId)) parObjet.set(track.objectId, [])
    parObjet.get(track.objectId)!.push(track)
  }

  for (const [objectId, tracks] of parObjet.entries()) {
    // Trouver le nom de l'objet
    const obj = project.objects.find((o) => o.id === objectId)
    const nomObjet = obj ? obj.name : `objet_${objectId.slice(0, 6)}`
    const selectorId = `#${objectId}`

    lines.push(`// --- ${nomObjet} ---`)

    for (const track of tracks) {
      if (track.keyframes.length < 2) {
        if (track.keyframes.length === 1) {
          const kf = track.keyframes[0]
          lines.push(
            `tl.set("${selectorId}", { ${track.property}: ${JSON.stringify(kf.value)} }, ${kf.time});`
          )
        }
        continue
      }

      // Construire une séquence de tweens entre chaque paire de keyframes
      for (let i = 0; i < track.keyframes.length - 1; i++) {
        const kfDep = track.keyframes[i]
        const kfArr = track.keyframes[i + 1]
        const duree = kfArr.time - kfDep.time

        lines.push(
          `tl.to("${selectorId}", { ${track.property}: ${JSON.stringify(kfArr.value)}, duration: ${duree.toFixed(3)}, ease: "${kfArr.easing}" }, ${kfDep.time});`
        )
      }
    }

    lines.push(``)
  }

  return lines.join('\n')
}
