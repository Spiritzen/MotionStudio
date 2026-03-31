// Piste keyframes — un AnimationTrack avec ses points d'animation
import { useObjectStore } from '../../store/objectStore'
import { useTimelineStore } from '../../store/timelineStore'
import { AnimationTrack } from '../../types'
import KeyframeComp from './Keyframe'
import styles from './TimelineTrack.module.css'

const LABELS_PROP: Record<AnimationTrack['property'], string> = {
  x: 'x',
  y: 'y',
  opacity: 'op',
  scaleX: 'sx',
  scaleY: 'sy',
  angle: 'rot',
}

interface KeyframeTrackProps {
  track: AnimationTrack
  pixelsPerSecond: number
  duration: number
  headerWidth: number
}

export default function KeyframeTrack({
  track,
  pixelsPerSecond,
  duration,
  headerWidth,
}: KeyframeTrackProps) {
  const { objects } = useObjectStore()
  const { addKeyframe, removeTrack } = useTimelineStore()

  const objet = objects.find((o) => o.id === track.objectId)
  const nomObjet = objet?.name ?? 'Objet'

  function handleDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const t = Math.max(0, Math.min(duration, x / pixelsPerSecond))
    addKeyframe(track.id, {
      time: t,
      value: 0,
      easing: 'power2.out',
    })
  }

  return (
    <div className={styles.track} data-property={track.property}>
      <div className={styles.trackHeader} style={{ width: headerWidth }}>
        <span className={styles.objectName}>{nomObjet}</span>
        <span className={styles.propertyName}>{LABELS_PROP[track.property]}</span>
        <button
          className={styles.deleteBtn}
          onClick={() => removeTrack(track.id)}
          title="Supprimer cette piste"
        >
          ×
        </button>
      </div>

      <div
        className={styles.trackBody}
        onDoubleClick={handleDoubleClick}
        style={{ width: duration * pixelsPerSecond }}
      >
        <div className={styles.trackBar} style={{ width: duration * pixelsPerSecond }} />
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
  )
}
