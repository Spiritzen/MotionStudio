// Modale export vidéo avec barre de progression
import { useState } from 'react'
import { Canvas as FabricCanvas } from 'fabric'
import { exportVideoMP4 } from '../../utils/exportVideo'

interface ExportModalProps {
  isOpen:       boolean
  onClose:      () => void
  fabricCanvas: FabricCanvas | null
  duration:     number
  projectName:  string
}

export default function ExportModal({
  isOpen, onClose, fabricCanvas, duration, projectName,
}: ExportModalProps) {
  const [exporting, setExporting] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [fps,       setFps]       = useState(30)
  const [error,     setError]     = useState<string | null>(null)

  if (!isOpen) return null

  const handleExport = async () => {
    if (!fabricCanvas) return
    setExporting(true)
    setProgress(0)
    setError(null)

    await exportVideoMP4(fabricCanvas, {
      fps,
      duration,
      quality: 0.92,
      onProgress: (pct) => setProgress(pct),
      onComplete: (blob) => {
        const url = URL.createObjectURL(blob)
        const a   = document.createElement('a')
        a.href    = url
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
        a.download = `${projectName}.${ext}`
        a.click()
        URL.revokeObjectURL(url)
        setExporting(false)
        setProgress(100)
        setTimeout(onClose, 1000)
      },
      onError: (err) => {
        setError(err.message)
        setExporting(false)
      },
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999,
    }}>
      <div style={{
        background: '#141820', border: '1px solid #1e293b',
        borderRadius: 12, padding: 32, width: 420,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: 18, fontWeight: 500 }}>
          Exporter en vidéo
        </h2>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 13, color: '#64748b' }}>FPS</label>
            <select
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              disabled={exporting}
              style={{
                background: '#0e1117', border: '1px solid #1e293b',
                borderRadius: 6, color: '#e2e8f0', padding: '4px 8px', fontSize: 13,
              }}
            >
              <option value={24}>24 fps (cinéma)</option>
              <option value={30}>30 fps (standard)</option>
              <option value={60}>60 fps (fluide)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Durée</span>
            <span style={{ fontSize: 13, color: '#e2e8f0' }}>{duration}s</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Format</span>
            <span style={{ fontSize: 13, color: '#e2e8f0' }}>WebM / MP4</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Temps estimé</span>
            <span style={{ fontSize: 13, color: '#e2e8f0' }}>~{Math.ceil(duration * 1.5)}s</span>
          </div>
        </div>

        {/* Barre de progression */}
        {exporting && (
          <div>
            <div style={{
              height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', background: '#8b5cf6', borderRadius: 3,
                width: `${progress}%`, transition: 'width 0.3s',
              }} />
            </div>
            <div style={{
              fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 6,
            }}>
              {progress}% — Export en cours...
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {/* Note */}
        <div style={{
          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#8b5cf6',
          lineHeight: 1.5,
        }}>
          L'export rejoue l'animation en temps réel et capture chaque frame.
          Ne pas interagir avec la fenêtre pendant l'export.
          Le format WebM est supporté sur tous les navigateurs modernes.
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={exporting}
            style={{
              background: 'transparent', border: '1px solid #1e293b',
              borderRadius: 6, color: '#64748b', padding: '8px 16px',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: exporting ? '#4c1d95' : '#8b5cf6',
              border: 'none', borderRadius: 6, color: 'white',
              padding: '8px 20px', cursor: exporting ? 'wait' : 'pointer',
              fontSize: 13, fontWeight: 500,
            }}
          >
            {exporting ? `Export... ${progress}%` : '▶ Exporter'}
          </button>
        </div>
      </div>
    </div>
  )
}
