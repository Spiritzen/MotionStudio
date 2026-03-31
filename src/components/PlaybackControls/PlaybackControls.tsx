// Contrôles de lecture — play/pause/stop/scrub
import { useTimelineStore } from '../../store/timelineStore'
import { animationEngine } from '../../engine/animationEngine'
import styles from './PlaybackControls.module.css'

// Formate le temps en MM:SS:FF
function formatTimecode(time: number, fps: number): string {
  const totalFrames = Math.round(time * fps)
  const frames = totalFrames % fps
  const totalSec = Math.floor(totalFrames / fps)
  const sec = totalSec % 60
  const min = Math.floor(totalSec / 60)
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
}

export default function PlaybackControls() {
  const { currentTime, duration, isPlaying, fps, setCurrentTime, setIsPlaying, setDuration } =
    useTimelineStore()

  function handlePlay() {
    if (isPlaying) {
      animationEngine.pause()
      setIsPlaying(false)
    } else {
      animationEngine.play()
      setIsPlaying(true)
    }
  }

  function handleStop() {
    animationEngine.stop()
    setIsPlaying(false)
    setCurrentTime(0)
  }

  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    const t = parseFloat(e.target.value)
    animationEngine.seek(t)
    setCurrentTime(t)
  }

  function handleDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value)
    if (!isNaN(v) && v > 0) {
      setDuration(v)
      animationEngine.setDuration(v)
    }
  }

  return (
    <div className={styles.controls}>
      {/* Bouton retour au début */}
      <button className={styles.btn} onClick={handleStop} title="Retour au début (Stop)">
        ⏮
      </button>

      {/* Play / Pause */}
      <button
        className={`${styles.btn} ${isPlaying ? styles.active : ''}`}
        onClick={handlePlay}
        title={isPlaying ? 'Pause' : 'Lecture'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Stop */}
      <button className={styles.btn} onClick={handleStop} title="Stop">
        ⏹
      </button>

      <div className={styles.separator} />

      {/* Timecode — temps actuel / durée totale */}
      <div className={styles.timecode}>
        <span className={styles.timecodeCurrent}>{formatTimecode(currentTime, fps)}</span>
        <span className={styles.timecodeSep}>/</span>
        <span className={styles.timecodeTotal}>{formatTimecode(duration, fps)}</span>
      </div>

      {/* Scrubber global */}
      <input
        type="range"
        className={styles.scrubber}
        min={0}
        max={duration}
        step={1 / fps}
        value={currentTime}
        onChange={handleScrub}
      />

      <div className={styles.separator} />

      {/* Durée éditable */}
      <div className={styles.durationRow}>
        <span className={styles.durationLabel}>Durée</span>
        <input
          type="number"
          className={styles.durationInput}
          value={duration}
          min={1}
          max={3600}
          step={1}
          onChange={handleDurationChange}
        />
        <span className={styles.durationLabel}>s</span>
      </div>

      <div className={styles.separator} />

      {/* FPS */}
      <span className={styles.fps}>{fps} fps</span>
    </div>
  )
}
