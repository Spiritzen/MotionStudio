// Toolbar — outils de création + import image/vidéo/audio
import { useRef } from 'react'
import { useUIStore, ActiveTool } from '../../store/uiStore'
import styles from './Toolbar.module.css'

export default function Toolbar() {
  const { activeTool, setActiveTool } = useUIStore()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      window.dispatchEvent(new CustomEvent<File>('motionstudio:image-input', { detail: file }))
      e.target.value = ''
    }
  }

  function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      window.dispatchEvent(new CustomEvent<File>('motionstudio:video-input', { detail: file }))
      e.target.value = ''
    }
  }

  function handleAudioFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      window.dispatchEvent(new CustomEvent<File>('motionstudio:audio-input', { detail: file }))
      e.target.value = ''
    }
  }

  function toolBtn(tool: ActiveTool, title: string, icon: React.ReactNode) {
    return (
      <button
        key={tool}
        className={`${styles.toolBtn} ${activeTool === tool ? styles.active : ''}`}
        onClick={() => {
          setActiveTool(tool)
          window.dispatchEvent(new CustomEvent('motionstudio:create', { detail: { tool } }))
        }}
        title={title}
        aria-label={title}
      >
        {icon}
        <span className={styles.toolLabel}>{title}</span>
      </button>
    )
  }

  return (
    <div className={styles.toolbar}>
      {/* Sélection */}
      {toolBtn('select', 'Sélection',
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 3l14 9-7 1-4 7L5 3z"/>
        </svg>
      )}

      <div className={styles.separator} />

      {/* Formes */}
      {toolBtn('rect', 'Rectangle',
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="1"/>
        </svg>
      )}
      {toolBtn('circle', 'Cercle',
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9"/>
        </svg>
      )}
      {toolBtn('text', 'Texte',
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M12 7v13M9 20h6"/>
        </svg>
      )}

      <div className={styles.separator} />

      {/* Import image */}
      <button
        className={styles.toolBtn}
        onClick={() => imageInputRef.current?.click()}
        title="Importer une image"
        aria-label="Importer une image"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="m21 15-5-5L5 21"/>
        </svg>
        <span className={styles.toolLabel}>Image</span>
      </button>

      {/* Import vidéo */}
      <button
        className={styles.toolBtn}
        onClick={() => videoInputRef.current?.click()}
        title="Importer une vidéo"
        aria-label="Importer une vidéo"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="6" width="15" height="12" rx="2"/>
          <path d="m17 10 5-3v10l-5-3V10Z"/>
        </svg>
        <span className={styles.toolLabel}>Vidéo</span>
      </button>

      {/* Import audio */}
      <button
        className={styles.toolBtn}
        onClick={() => audioInputRef.current?.click()}
        title="Importer un son (MP3, WAV, OGG)"
        aria-label="Importer un son"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <span className={styles.toolLabel}>Audio</span>
      </button>

      {/* Inputs fichiers cachés */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleImageFile}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg"
        style={{ display: 'none' }}
        onChange={handleVideoFile}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac"
        style={{ display: 'none' }}
        onChange={handleAudioFile}
      />
    </div>
  )
}
