// Barre de menu supérieure — gestion du projet
import { useRef, useState, useEffect } from 'react'
import { Canvas as FabricCanvas } from 'fabric'
import { useObjectStore } from '../../store/objectStore'
import { useTimelineStore } from '../../store/timelineStore'
import { useUIStore } from '../../store/uiStore'
import { serializeProject } from '../../utils/serializer'
import { deserializeProject } from '../../utils/serializer'
import { saveToLocalStorage } from '../../utils/storage'
import { exportProjectFile, importProjectFile } from '../../utils/exportJSON'
import { generateGSAPCode } from '../../utils/exportGSAP'
import { generateCSSKeyframes } from '../../utils/exportCSS'
import { CANVAS_FORMATS, CanvasFormat } from '../../types'
import styles from './ProjectManager.module.css'

interface ProjectManagerProps {
  fabricCanvas:   FabricCanvas | null
  onExportVideo?: () => void
}

export default function ProjectManager({ fabricCanvas, onExportVideo }: ProjectManagerProps) {
  const { objects, setObjects } = useObjectStore()
  const { tracks, currentTime: _ct, duration, fps, setTracks } = useTimelineStore()
  const { projectName, isDirty, activeFormat, setProjectName, setDirty, setActiveFormat, canvasZoom, setCanvasZoom } = useUIStore()

  const ZOOM_LEVELS = [10, 25, 33, 50, 67, 75, 100, 125, 150, 200]

  const [saved, setSaved] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showFormatMenu, setShowFormatMenu] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<CanvasFormat>(CANVAS_FORMATS[0])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const exportDropdownRef = useRef<HTMLDivElement>(null)
  const formatDropdownRef = useRef<HTMLDivElement>(null)

  // Fermer les menus au clic extérieur — useCapture:true pour intercepter avant le canvas Fabric
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(target)) {
        setShowExportMenu(false)
      }
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(target)) {
        setShowFormatMenu(false)
      }
    }
    document.addEventListener('mousedown', handler, true)
    return () => document.removeEventListener('mousedown', handler, true)
  }, [])

  // Obtenir le projet sérialisé (async — sérialise les médias en base64)
  async function getProject() {
    if (!fabricCanvas) throw new Error('Canvas non initialisé')
    return serializeProject(
      fabricCanvas,
      { objects, tracks, ui: { projectName, activeFormat } },
      { duration, fps }
    )
  }

  // Sauvegarder manuellement
  async function handleSave() {
    try {
      const project = await getProject()
      saveToLocalStorage(project)
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('[MotionStudio] Erreur sauvegarde:', err)
    }
  }

  // Nouveau projet
  function handleNew() {
    if (isDirty) {
      if (!window.confirm('Des modifications non sauvegardées seront perdues. Continuer ?')) return
    }
    setShowNewModal(true)
    setSelectedFormat(CANVAS_FORMATS[0])
  }

  function confirmerNouveauProjet() {
    if (!fabricCanvas) return
    fabricCanvas.clear()
    fabricCanvas.backgroundColor = '#1a1f2e'
    fabricCanvas.setDimensions({ width: selectedFormat.width, height: selectedFormat.height })
    fabricCanvas.renderAll()

    setObjects([])
    setTracks([])
    setProjectName('Nouveau projet')
    setActiveFormat(selectedFormat)
    setDirty(false)
    setShowNewModal(false)
  }

  // Ouvrir un fichier
  async function handleOpen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !fabricCanvas) return

    try {
      const project = await importProjectFile(file)
      await deserializeProject(
        project,
        fabricCanvas,
        setObjects,
        setTracks,
        (name, format) => {
          setProjectName(name)
          setActiveFormat(format)
        }
      )
      setDirty(false)
    } catch (err) {
      alert(`Erreur ouverture : ${err instanceof Error ? err.message : 'Fichier invalide'}`)
    }

    e.target.value = ''
  }

  // Exporter .motionstudio (avec médias embarqués)
  async function handleExportFile() {
    try {
      const project = await getProject()
      exportProjectFile(project)
    } catch (err) {
      console.error('[MotionStudio] Erreur export:', err)
    }
    setShowExportMenu(false)
  }

  // Exporter code GSAP → clipboard
  async function handleExportGSAP() {
    try {
      const project = await getProject()
      const code = generateGSAPCode(project)
      await navigator.clipboard.writeText(code)
      alert('Code GSAP copié dans le presse-papier !')
    } catch (err) {
      console.error('[MotionStudio] Erreur export GSAP:', err)
    }
    setShowExportMenu(false)
  }

  // Exporter CSS Keyframes → téléchargement .css
  async function handleExportCSS() {
    try {
      const project = await getProject()
      const css     = generateCSSKeyframes(project)
      const blob    = new Blob([css], { type: 'text/css' })
      const url     = URL.createObjectURL(blob)
      const a       = document.createElement('a')
      a.href        = url
      a.download    = `${project.name}.css`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[MotionStudio] Erreur export CSS:', err)
    }
    setShowExportMenu(false)
  }

  // Ouvrir modale export vidéo
  function handleExportVideo() {
    setShowExportMenu(false)
    onExportVideo?.()
  }

  // Zoom canvas
  function zoomStep(dir: 1 | -1) {
    const current = canvasZoom === 0 ? 100 : canvasZoom
    if (dir > 0) {
      const next = ZOOM_LEVELS.find(z => z > current)
      if (next !== undefined) setCanvasZoom(next)
    } else {
      const prev = [...ZOOM_LEVELS].reverse().find(z => z < current)
      if (prev !== undefined) setCanvasZoom(prev)
    }
  }

  // Changer le format
  function handleFormatChange(format: CanvasFormat) {
    setActiveFormat(format)
    if (fabricCanvas) {
      fabricCanvas.setDimensions({ width: format.width, height: format.height })
      fabricCanvas.renderAll()
    }
    setDirty(true)
    setShowFormatMenu(false)
  }

  return (
    <div className={styles.bar}>
      {/* Logo */}
      <span className={styles.logo}>MotionStudio</span>

      <div className={styles.separator} />

      {/* Nom du projet */}
      <div className={styles.projectName}>
        {isDirty && <span className={styles.dirtyDot} title="Modifications non sauvegardées" />}
        <input
          className={styles.projectInput}
          value={projectName}
          onChange={(e) => {
            setProjectName(e.target.value)
            setDirty(true)
          }}
          title="Nom du projet"
        />
      </div>

      <div className={styles.separator} />

      {/* Nouveau */}
      <button className={styles.btn} onClick={handleNew}>Nouveau</button>

      {/* Ouvrir */}
      <button className={styles.btn} onClick={() => fileInputRef.current?.click()}>Ouvrir</button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".motionstudio,.json"
        style={{ display: 'none' }}
        onChange={handleOpen}
      />

      {/* Sauvegarder */}
      <button
        className={`${styles.btn} ${saved ? styles.btnSaved : ''}`}
        onClick={handleSave}
      >
        {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
      </button>

      {/* Exporter — ref pour la fermeture au clic extérieur */}
      <div ref={exportDropdownRef} className={styles.dropdown}>
        <button
          className={styles.btn}
          onClick={() => setShowExportMenu((v) => !v)}
        >
          Exporter ▾
        </button>
        {showExportMenu && (
          <div className={styles.dropdownMenu}>
            <button className={styles.dropdownItem} onClick={handleExportFile}>
              📦 Exporter .motionstudio
            </button>
            <button className={styles.dropdownItem} onClick={handleExportGSAP}>
              💻 Exporter code GSAP
            </button>
            <button className={styles.dropdownItem} onClick={handleExportCSS}>
              🎨 Exporter CSS Keyframes
            </button>
            <button className={styles.dropdownItem} onClick={handleExportVideo}>
              🎬 Exporter vidéo (WebM/MP4)
            </button>
          </div>
        )}
      </div>

      <div className={styles.separator} />

      {/* Zoom canvas */}
      <div className={styles.zoomControls}>
        <button
          className={styles.zoomBtn}
          onClick={() => zoomStep(-1)}
          title="Zoom arrière (Ctrl+−)"
        >−</button>
        <span
          className={styles.zoomValue}
          onClick={() => setCanvasZoom(0)}
          title="Ajuster à l'écran (Ctrl+0)"
        >
          {canvasZoom === 0 ? 'Fit' : `${canvasZoom}%`}
        </span>
        <button
          className={styles.zoomBtn}
          onClick={() => zoomStep(1)}
          title="Zoom avant (Ctrl+=)"
        >+</button>
      </div>

      <div className={styles.separator} />

      {/* Sélecteur de format — ref pour la fermeture au clic extérieur */}
      <div className={styles.formatSelectorRow}>
        <span className={styles.formatSelectorLabel}>Format :</span>
        <div ref={formatDropdownRef} className={styles.dropdown}>
          <button
            className={styles.btn}
            onClick={() => setShowFormatMenu((v) => !v)}
          >
            {activeFormat.label} ▾
          </button>
          {showFormatMenu && (
            <div className={styles.dropdownMenuRight}>
              {CANVAS_FORMATS.map((f) => (
                <button
                  key={f.id}
                  className={styles.dropdownItem}
                  style={activeFormat.id === f.id ? { color: '#8b5cf6' } : {}}
                  onClick={() => handleFormatChange(f)}
                >
                  <span>{f.label}</span>
                  <span className={styles.dropdownItemDims}>{f.width}×{f.height}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modale nouveau projet */}
      {showNewModal && (
        <div className={styles.modal} onClick={() => setShowNewModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Nouveau projet — Choisir un format</div>
            <div className={styles.formatGrid}>
              {CANVAS_FORMATS.map((f) => (
                <button
                  key={f.id}
                  className={`${styles.formatBtn} ${selectedFormat.id === f.id ? styles.selected : ''}`}
                  onClick={() => setSelectedFormat(f)}
                >
                  <div className={styles.formatLabel}>{f.label}</div>
                  <div className={styles.formatSize}>{f.width} × {f.height}</div>
                </button>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setShowNewModal(false)}>
                Annuler
              </button>
              <button className={styles.btnConfirm} onClick={confirmerNouveauProjet}>
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
