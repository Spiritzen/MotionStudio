// Export / import de fichiers .motionstudio
import { Project } from '../types'

// Télécharge le projet sous forme de fichier .motionstudio
export function exportProjectFile(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name}.motionstudio`
  a.click()
  URL.revokeObjectURL(url)
}

// Lit un fichier .motionstudio ou .json et retourne le Project parsé
export async function importProjectFile(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string
        const project = JSON.parse(raw) as Project

        // Validation des champs obligatoires
        if (!project.id || !project.version || !project.fabricJSON || !project.timeline) {
          throw new Error('Fichier .motionstudio invalide : champs obligatoires manquants')
        }

        resolve(project)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Erreur lecture fichier'))
    reader.readAsText(file)
  })
}
