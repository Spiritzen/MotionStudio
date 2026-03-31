// Barre de durée (clip) d'un objet dans la timeline — déplaçable et redimensionnable
import { useEffect, useRef } from 'react'
import { MotionObject } from '../../types'
import styles from './Timeline.module.css'

const CLIP_COLORS: Record<MotionObject['type'], string> = {
  rect:   '#8b5cf6',
  circle: '#f59e0b',
  text:   '#3b82f6',
  image:  '#14b8a6',
  video:  '#f97316',
  audio:  '#06b6d4',
  group:  '#a78bfa',
}

type DragMode = 'move' | 'left' | 'right' | null

interface TimelineTrackProps {
  obj: MotionObject
  pixelsPerSecond: number
  duration: number
  onUpdateClip: (id: string, startTime: number, endTime: number) => void
}

export default function TimelineTrack({
  obj,
  pixelsPerSecond,
  duration,
  onUpdateClip,
}: TimelineTrackProps) {
  const startTime = obj.startTime ?? 0
  const endTime   = obj.endTime   ?? duration

  // Refs pour le drag — jamais stale, sans re-subscription
  const dragModeRef    = useRef<DragMode>(null)
  const dragStartXRef  = useRef(0)
  const dragStartSTRef = useRef(0)
  const dragStartETRef = useRef(0)

  // Refs pour les valeurs dynamiques — useEffect([]) peut les lire sans deps
  const ppsRef      = useRef(pixelsPerSecond)
  const durationRef = useRef(duration)
  const callbackRef = useRef(onUpdateClip)
  const objRef      = useRef(obj)

  useEffect(() => { ppsRef.current = pixelsPerSecond }, [pixelsPerSecond])
  useEffect(() => { durationRef.current = duration }, [duration])
  useEffect(() => { callbackRef.current = onUpdateClip }, [onUpdateClip])
  useEffect(() => { objRef.current = obj }, [obj])

  // Un seul abonnement global — toujours actif pendant la vie du composant
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragModeRef.current) return
      const dx  = e.clientX - dragStartXRef.current
      const dt  = dx / ppsRef.current
      const dur = durationRef.current
      let st = dragStartSTRef.current
      let et = dragStartETRef.current

      if (dragModeRef.current === 'move') {
        const len = et - st
        st = Math.max(0, Math.min(dur - len, st + dt))
        et = st + len
      } else if (dragModeRef.current === 'left') {
        st = Math.max(0, Math.min(et - 0.1, st + dt))
      } else if (dragModeRef.current === 'right') {
        et = Math.max(st + 0.1, Math.min(dur, et + dt))
      }

      callbackRef.current(objRef.current.id, st, et)
    }

    const onMouseUp = () => {
      dragModeRef.current = null
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  function startDrag(mode: DragMode, e: React.MouseEvent) {
    dragModeRef.current    = mode
    dragStartXRef.current  = e.clientX
    dragStartSTRef.current = startTime
    dragStartETRef.current = endTime
    e.preventDefault()
    e.stopPropagation()
  }

  const left  = startTime * pixelsPerSecond
  const width = Math.max(6, (endTime - startTime) * pixelsPerSecond)
  const color = CLIP_COLORS[obj.type]

  return (
    <div
      className={styles.clip}
      style={{ left, width, background: color }}
      onMouseDown={(e) => startDrag('move', e)}
    >
      <div
        className={styles.clipHandleLeft}
        onMouseDown={(e) => startDrag('left', e)}
      />
      <span className={styles.clipLabel}>{obj.name}</span>
      <div
        className={styles.clipHandleRight}
        onMouseDown={(e) => startDrag('right', e)}
      />
    </div>
  )
}
