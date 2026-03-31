// Persistance localStorage — sauvegarde automatique et manuelle
import { Project } from '../types'

const STORAGE_KEY = 'motionstudio_project'
const AUTOSAVE_INTERVAL = 30000 // 30 secondes

export function saveToLocalStorage(project: Project): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
  } catch (err) {
    console.error('[MotionStudio] Erreur sauvegarde localStorage:', err)
  }
}

export function loadFromLocalStorage(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Project
  } catch (err) {
    console.error('[MotionStudio] Erreur chargement localStorage:', err)
    return null
  }
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// Lance l'autosave si isDirty === true, toutes les 30s
// Retourne la fonction de nettoyage pour annuler l'intervalle
export function startAutosave(
  getProject: () => Promise<Project>,
  isDirty:    () => boolean,
  onSaved?:   () => void
): () => void {
  const interval = setInterval(async () => {
    if (!isDirty()) return
    try {
      const project = await getProject()
      saveToLocalStorage(project)
      onSaved?.()
      console.log('[Autosave] Projet sauvegardé automatiquement')
    } catch (e) {
      console.warn('[Autosave] Échec:', e)
    }
  }, AUTOSAVE_INTERVAL)

  return () => clearInterval(interval)
}
