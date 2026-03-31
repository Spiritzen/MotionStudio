// Timeline — labels fixes + zone scrollable horizontalement
import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas as FabricCanvas, FabricObject } from 'fabric'
import { useTimelineStore } from '../../store/timelineStore'
import { useObjectStore } from '../../store/objectStore'
import { useUIStore } from '../../store/uiStore'
import { useHistoryStore } from '../../store/historyStore'
import { animationEngine } from '../../engine/animationEngine'
import { audioManager } from '../../engine/audioManager'
import { MotionObject } from '../../types'
import TimelineTrack from './TimelineTrack'
import KeyframeComp from './Keyframe'
import styles from './Timeline.module.css'

const ICONES_TYPE: Record<MotionObject['type'], string> = {
  rect:   '□',
  circle: '○',
  text:   'T',
  image:  '🖼',
  video:  '🎬',
  audio:  '♪',
}

const KF_PROP_LABELS: Record<string, string> = {
  x: 'X', y: 'Y', opacity: 'Op', scaleX: 'Sx', scaleY: 'Sy', angle: 'Rot',
}

const KF_PROP_COLORS: Record<string, string> = {
  x:       '#8b5cf6',
  y:       '#3b82f6',
  opacity: '#10b981',
  scaleX:  '#f59e0b',
  scaleY:  '#f59e0b',
  angle:   '#ef4444',
}

interface TimelineProps {
  fabricRef: React.RefObject<FabricCanvas | null>
  onCapture?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSplit?: (objectId: string, splitTime: number) => void
}

function formatRulerTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

export default function Timeline({ fabricRef, onCapture, onUndo, onRedo, onSplit }: TimelineProps) {
  const {
    tracks, currentTime, duration, isPlaying,
    setCurrentTime, addKeyframe, removeTrack,
  } = useTimelineStore()
  const {
    objects, removeObject, reorderObjects, addObject,
    updateClip, updateObject, selectedObjectId, selectObject,
  } = useObjectStore()
  const { setDirty, timelineMode, setTimelineMode } = useUIStore()
  const canUndo = useHistoryStore((s) => s.canUndo)
  const canRedo = useHistoryStore((s) => s.canRedo)

  const [pixelsPerSecond, setPixelsPerSecond] = useState(80)
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set())
  const [draggedId,  setDraggedId]  = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [splitPreviewX, setSplitPreviewX] = useState<number | null>(null)

  const scrollRef    = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const totalWidth = duration * pixelsPerSecond
  const scrubberX  = currentTime * pixelsPerSecond

  // ── Auto-scroll pendant la lecture ──────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !isPlaying) return
    const x = currentTime * pixelsPerSecond
    const visibleLeft  = el.scrollLeft
    const visibleRight = el.scrollLeft + el.clientWidth
    if (x > visibleRight - 40) {
      el.scrollLeft = x - el.clientWidth / 2
    } else if (x < visibleLeft + 40) {
      el.scrollLeft = Math.max(0, x - 40)
    }
  }, [currentTime, isPlaying, pixelsPerSecond])

  // ── Conversion clientX → temps (tient compte du scroll) ─────────────────
  const xToTime = useCallback(
    (clientX: number): number => {
      const el = scrollRef.current
      if (!el) return 0
      const rect = el.getBoundingClientRect()
      const x    = clientX - rect.left + el.scrollLeft
      return Math.max(0, Math.min(duration, x / pixelsPerSecond))
    },
    [duration, pixelsPerSecond]
  )

  const seek = useCallback(
    (t: number) => {
      animationEngine.seek(t)
      setCurrentTime(t)
    },
    [setCurrentTime]
  )

  // ── Drag global pour le scrub ────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      seek(xToTime(e.clientX))
    }
    const onMouseUp = () => { isDraggingRef.current = false }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [seek, xToTime])

  function handleRulerMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    isDraggingRef.current = true
    seek(xToTime(e.clientX))
    e.preventDefault()
  }

  function handleScrubberMouseDown(e: React.MouseEvent) {
    isDraggingRef.current = true
    e.preventDefault()
    e.stopPropagation()
  }

  function toggleExpand(id: string) {
    setExpandedObjects((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSelectFromTimeline(objectId: string) {
    selectObject(objectId)
    const fc = fabricRef.current
    if (!fc) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fabricObj = fc.getObjects().find((o) => (o as any).motionId === objectId)
    if (fabricObj) {
      fc.setActiveObject(fabricObj)
      fc.renderAll()
    }
  }

  function supprimerObjet(id: string) {
    const fc = fabricRef.current
    if (fc) {
      const objs = fc.getObjects() as FabricObject[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fabricObj = objs.find((o) => (o as any).motionId === id)
      if (fabricObj) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stopLoop = (fabricObj as any)._stopRenderLoop as (() => void) | undefined
        if (stopLoop) stopLoop()
        fc.remove(fabricObj)
        fc.discardActiveObject()
        fc.renderAll()
      }
    }
    audioManager.removeTrack(id)
    tracks.filter((t) => t.objectId === id).forEach((t) => removeTrack(t.id))
    removeObject(id)
    setDirty(true)
    onCapture?.()
  }

  function ajouterPisteVide() {
    const id = `empty-${Date.now()}`
    addObject({
      id,
      fabricId: '',
      name:     `Piste ${objects.length + 1}`,
      type:     'rect',
      visible:  true,
      locked:   false,
    })
    setDirty(true)
  }

  function renderGraduations() {
    const marks = []
    const interval = pixelsPerSecond < 40 ? 5 : pixelsPerSecond < 80 ? 1 : 0.5
    for (let t = 0; t <= duration + 0.001; t += interval) {
      const x       = Math.round(t * pixelsPerSecond)
      const isMajor = t % 1 === 0
      marks.push(
        <div
          key={t}
          className={isMajor ? styles.markMajor : styles.markMinor}
          style={{ left: x }}
        >
          {isMajor && <span className={styles.markLabel}>{formatRulerTime(t)}</span>}
        </div>
      )
    }
    return marks
  }

  return (
    <div className={styles.timelineContainer}>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className={styles.timelineToolbar}>
        <span className={styles.toolbarLabel}>Zoom</span>
        <input
          type="range"
          className={styles.zoomSlider}
          min={20}
          max={300}
          value={pixelsPerSecond}
          onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
        />
        <span className={styles.toolbarLabel}>{pixelsPerSecond}px/s</span>
        <button className={styles.addTrackBtn} onClick={ajouterPisteVide}>
          + Piste vide
        </button>

        <div className={styles.toolbarSeparator} />

        {/* Boutons Undo / Redo */}
        <div className={styles.undoRedoGroup}>
          <button
            className={styles.historyBtn}
            onClick={onUndo}
            disabled={!canUndo()}
            title="Revenir en arrière  Ctrl+Z"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6"/>
              <path d="M3 13C5.333 7.667 9.6 5 16 5c3.6 0 6.333 1.333 8 4"/>
            </svg>
          </button>
          <button
            className={styles.historyBtn}
            onClick={onRedo}
            disabled={!canRedo()}
            title="Rétablir  Ctrl+Y"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6"/>
              <path d="M21 13C18.667 7.667 14.4 5 8 5c-3.6 0-6.333 1.333-8 4"/>
            </svg>
          </button>
        </div>

        <div className={styles.toolbarSeparator} />

        {/* Bouton ciseaux — mode Split */}
        <button
          className={`${styles.historyBtn} ${timelineMode === 'split' ? styles.historyBtnActive : ''}`}
          onClick={() => setTimelineMode(timelineMode === 'split' ? 'select' : 'split')}
          title="Couper un clip  S"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6"  cy="6"  r="3"/>
            <circle cx="6"  cy="18" r="3"/>
            <line x1="20" y1="4"  x2="8.12"  y2="15.88"/>
            <line x1="14.47" y1="14.48" x2="20" y2="20"/>
            <line x1="8.12"  y1="8.12"  x2="12" y2="12"/>
          </svg>
        </button>
      </div>

      {/* ── Body : labels (fixe) + zone scrollable (droite) ──────────────── */}
      <div className={styles.timelineBody}>

        {/* Colonne gauche FIXE */}
        <div className={styles.labelsColumn}>
          <div className={styles.labelsRulerSpacer} />

          {objects.length === 0 && (
            <div className={styles.labelsEmpty}>Aucune piste</div>
          )}

          {objects.map((obj) => {
            const pistesObjet = tracks.filter((t) => t.objectId === obj.id)
            const estDeplie   = expandedObjects.has(obj.id)
            const estDragged  = draggedId  === obj.id
            const estDragOver = dragOverId === obj.id

            return (
              <React.Fragment key={obj.id}>
                {/* Label de l'objet */}
                <div
                  className={[
                    styles.labelRow,
                    selectedObjectId === obj.id ? styles.labelSelected  : '',
                    estDragged                  ? styles.labelDragging  : '',
                    estDragOver                 ? styles.labelDragOver  : '',
                  ].join(' ')}
                  draggable
                  onDragStart={() => setDraggedId(obj.id)}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverId(obj.id) }}
                  onDrop={() => {
                    if (draggedId && dragOverId && draggedId !== dragOverId) {
                      reorderObjects(draggedId, dragOverId)
                    }
                    setDraggedId(null); setDragOverId(null)
                  }}
                  onClick={() => handleSelectFromTimeline(obj.id)}
                >
                  <span
                    className={styles.chevron}
                    onClick={(e) => { e.stopPropagation(); toggleExpand(obj.id) }}
                  >
                    {estDeplie ? '▼' : '▶'}
                  </span>
                  <span className={styles.labelIcon}>{ICONES_TYPE[obj.type]}</span>
                  <span className={styles.labelName}>{obj.name}</span>

                  {(obj.type === 'video' || obj.type === 'audio') && (
                    <button
                      className={`${styles.muteBtn} ${obj.muted ? styles.mutedActive : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        const newMuted = !(obj.muted ?? false)
                        updateObject(obj.id, { muted: newMuted })
                        if (obj.type === 'audio') {
                          audioManager.updateTrack(obj.id, { muted: newMuted })
                        } else if (fabricRef.current) {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const fo = fabricRef.current.getObjects().find((o) => (o as any).motionId === obj.id)
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const ve = (fo as any)?._videoEl as HTMLVideoElement | undefined
                          if (ve) ve.muted = newMuted
                        }
                        setDirty(true)
                      }}
                      title={obj.muted ? 'Activer le son' : 'Couper le son'}
                    >
                      {obj.muted ? '🔇' : '🔊'}
                    </button>
                  )}

                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); supprimerObjet(obj.id) }}
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>

                {/* Labels des keyframe tracks dépliées */}
                {estDeplie && (
                  pistesObjet.length === 0 ? (
                    <div className={`${styles.labelRowSub} ${styles.labelRowSubEmpty}`}>
                      Aucune animation
                    </div>
                  ) : (
                    pistesObjet.map((track) => (
                      <div key={track.id} className={styles.labelRowSub}>
                        <span
                          className={styles.kfPropDot}
                          style={{ background: KF_PROP_COLORS[track.property] ?? '#8b5cf6' }}
                        />
                        <span className={styles.kfPropName}>
                          {KF_PROP_LABELS[track.property] ?? track.property}
                        </span>
                        <button
                          className={styles.kfDeleteBtn}
                          onClick={() => removeTrack(track.id)}
                          title="Supprimer cette piste"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Zone droite SCROLLABLE */}
        <div
          ref={scrollRef}
          className={styles.scrollArea}
          onMouseLeave={() => setSplitPreviewX(null)}
        >
          <div
            style={{ width: totalWidth, position: 'relative', minWidth: '100%' }}
            onMouseMove={(e) => {
              if (timelineMode !== 'split') return
              const el = scrollRef.current
              if (!el) return
              const x = e.clientX - el.getBoundingClientRect().left + el.scrollLeft
              setSplitPreviewX(x)
            }}
          >

            {/* Règle temporelle */}
            <div className={styles.ruler} onMouseDown={handleRulerMouseDown}>
              {renderGraduations()}
              <div
                className={styles.scrubber}
                style={{ left: scrubberX }}
                onMouseDown={handleScrubberMouseDown}
              />
            </div>

            {/* Ligne verticale du scrubber */}
            <div className={styles.scrubberLine} style={{ left: scrubberX }} />

            {/* Ligne de prévisualisation du split */}
            {timelineMode === 'split' && splitPreviewX !== null && (
              <div className={styles.splitPreviewLine} style={{ left: splitPreviewX }} />
            )}

            {objects.length === 0 && (
              <div className={styles.emptyMessage}>
                Ajoutez des objets sur le canvas pour voir apparaître les pistes
              </div>
            )}

            {/* Pistes */}
            {objects.map((obj) => {
              const pistesObjet = tracks.filter((t) => t.objectId === obj.id)
              const estDeplie   = expandedObjects.has(obj.id)

              return (
                <React.Fragment key={obj.id}>
                  {/* Ligne clip */}
                  <div className={styles.trackContent}>
                    <TimelineTrack
                      obj={obj}
                      pixelsPerSecond={pixelsPerSecond}
                      duration={duration}
                      onUpdateClip={(id, start, end) => {
                        updateClip(id, start, end)
                        if (obj.type === 'audio') {
                          audioManager.updateTrack(id, { startTime: start, endTime: end })
                        }
                      }}
                    />
                    {/* Overlay transparent pour le mode ciseaux */}
                    {timelineMode === 'split' && (
                      <div
                        className={styles.splitOverlay}
                        onClick={(e) => {
                          onSplit?.(obj.id, xToTime(e.clientX))
                        }}
                      />
                    )}
                  </div>

                  {/* Lignes keyframe (dépliées) */}
                  {estDeplie && (
                    pistesObjet.length === 0 ? (
                      <div className={styles.kfTrackRow} />
                    ) : (
                      pistesObjet.map((track) => (
                        <div key={track.id} className={styles.kfTrackRow}>
                          <div
                            className={styles.kfTrackBody}
                            style={{ width: totalWidth }}
                            onDoubleClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const t    = Math.max(0, Math.min(duration, (e.clientX - rect.left) / pixelsPerSecond))
                              addKeyframe(track.id, { time: t, value: 0, easing: 'power2.out' })
                            }}
                          >
                            <div
                              className={styles.kfTrackBar}
                              style={{ background: KF_PROP_COLORS[track.property] ?? '#8b5cf6' }}
                            />
                            {track.keyframes.map((kf) => (
                              <KeyframeComp
                                key={kf.id}
                                keyframe={kf}
                                trackId={track.id}
                                pixelsPerSecond={pixelsPerSecond}
                                duration={duration}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
