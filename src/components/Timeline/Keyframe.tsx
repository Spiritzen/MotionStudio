// Keyframe — losange draggable sur une piste
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTimelineStore } from '../../store/timelineStore'
import { Keyframe as KeyframeType } from '../../types'
import styles from './Keyframe.module.css'

const EASINGS = ['linear', 'power1.out', 'power2.out', 'power3.out', 'back.out', 'elastic.out', 'bounce.out']

interface KeyframeProps {
  keyframe: KeyframeType
  trackId: string
  pixelsPerSecond: number
  duration: number
}

export default function KeyframeComp({ keyframe, trackId, pixelsPerSecond, duration }: KeyframeProps) {
  const { updateKeyframe, deleteKeyframe } = useTimelineStore()
  const [isDragging, setIsDragging] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const dragStartX = useRef(0)
  const dragStartTime = useRef(0)

  const posLeft = keyframe.time * pixelsPerSecond

  // Drag horizontal pour changer keyframe.time
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartTime.current = keyframe.time
  }, [keyframe.time])

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX.current
      const deltaTime = deltaX / pixelsPerSecond
      const newTime = Math.max(0, Math.min(duration, dragStartTime.current + deltaTime))
      updateKeyframe(trackId, keyframe.id, { time: newTime })
    }

    const handleUp = () => setIsDragging(false)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, trackId, keyframe.id, pixelsPerSecond, duration, updateKeyframe])

  // Menu contextuel
  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  function fermerMenu() {
    setContextMenu(null)
  }

  // Fermer le menu contextuel au clic ailleurs
  useEffect(() => {
    if (!contextMenu) return
    const close = () => fermerMenu()
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  const valeurAffichee = typeof keyframe.value === 'number'
    ? keyframe.value.toFixed(2)
    : String(keyframe.value)

  return (
    <>
      <div
        className={`${styles.keyframe} ${isDragging ? styles.dragging : ''}`}
        style={{ left: posLeft }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        title={`t=${keyframe.time.toFixed(2)}s — val=${valeurAffichee} — ${keyframe.easing}`}
      >
        <span className={styles.tooltip}>
          {keyframe.time.toFixed(2)}s · {valeurAffichee}
        </span>
      </div>

      {/* Menu contextuel via portal */}
      {contextMenu &&
        createPortal(
          <div
            className={styles.contextMenu}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '4px 14px 6px', borderBottom: '1px solid #1e293b' }}>
              <div style={{ fontSize: 10, color: '#64748b' }}>Easing</div>
              {EASINGS.map((ease) => (
                <button
                  key={ease}
                  className={styles.contextMenuItem}
                  style={{ fontWeight: keyframe.easing === ease ? 600 : 400 }}
                  onClick={() => {
                    updateKeyframe(trackId, keyframe.id, { easing: ease })
                    fermerMenu()
                  }}
                >
                  {ease}
                </button>
              ))}
            </div>
            <button
              className={`${styles.contextMenuItem} ${styles.danger}`}
              onClick={() => {
                deleteKeyframe(trackId, keyframe.id)
                fermerMenu()
              }}
            >
              🗑 Supprimer
            </button>
          </div>,
          document.body
        )}
    </>
  )
}
