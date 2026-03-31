// Gestionnaire de pistes audio — Web Audio API
// AudioContext + AudioBuffer préchargé en mémoire + AudioBufferSourceNode (usage unique)
// Élimine les grésillements et artefacts de HTMLAudioElement

interface AudioTrack {
  id:               string
  buffer:           AudioBuffer
  startTime:        number   // début du clip dans la timeline (secondes)
  endTime:          number   // fin du clip dans la timeline (secondes)
  volume:           number   // 0–1
  muted:            boolean
  sourceNode:       AudioBufferSourceNode | null
  gainNode:         GainNode | null
  playStartedAt:    number   // audioCtx.currentTime au moment du play
  playOffsetInClip: number   // offset dans le buffer au moment du play
}

class AudioManager {
  private ctx:    AudioContext | null = null
  private tracks: Map<string, AudioTrack> = new Map()

  // ── Contexte audio — lazy, créé après interaction utilisateur ───────────
  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  // ── Charger et décoder un fichier audio complètement en mémoire ─────────
  async loadFile(id: string, file: File, clipStartTime = 0): Promise<number> {
    const ctx = this.getContext()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    const duration    = audioBuffer.duration

    this.tracks.set(id, {
      id,
      buffer:           audioBuffer,
      startTime:        clipStartTime,
      endTime:          clipStartTime + duration,
      volume:           1,
      muted:            false,
      sourceNode:       null,
      gainNode:         null,
      playStartedAt:    0,
      playOffsetInClip: 0,
    })

    return duration
  }

  // ── Mettre à jour les propriétés d'une piste ────────────────────────────
  updateTrack(id: string, patch: Partial<Pick<AudioTrack, 'startTime' | 'endTime' | 'volume' | 'muted'>>): void {
    const track = this.tracks.get(id)
    if (!track) return
    Object.assign(track, patch)
    // Appliquer le volume/mute en temps réel si en lecture
    if (track.gainNode) {
      track.gainNode.gain.value = track.muted ? 0 : track.volume
    }
  }

  // ── Supprimer une piste ─────────────────────────────────────────────────
  removeTrack(id: string): void {
    const track = this.tracks.get(id)
    if (!track) return
    this._stopTrack(track)
    this.tracks.delete(id)
  }

  // ── Démarrer la lecture d'une piste à l'offset correct ─────────────────
  private _playTrack(track: AudioTrack, timelineCurrentTime: number): void {
    const ctx = this.getContext()
    this._stopTrack(track)

    const offsetInClip = Math.max(0, timelineCurrentTime - track.startTime)
    if (offsetInClip >= track.buffer.duration) return

    // AudioBufferSourceNode est à usage unique — en créer un nouveau à chaque play
    const source = ctx.createBufferSource()
    source.buffer = track.buffer

    const gain = ctx.createGain()
    gain.gain.value = track.muted ? 0 : track.volume

    source.connect(gain)
    gain.connect(ctx.destination)
    source.start(0, offsetInClip)

    track.sourceNode       = source
    track.gainNode         = gain
    track.playStartedAt    = ctx.currentTime
    track.playOffsetInClip = offsetInClip

    source.onended = () => {
      if (track.sourceNode === source) {
        track.sourceNode = null
        track.gainNode   = null
      }
    }
  }

  // ── Arrêter une piste ───────────────────────────────────────────────────
  private _stopTrack(track: AudioTrack): void {
    if (track.sourceNode) {
      try { track.sourceNode.stop() } catch { /* déjà arrêté */ }
      try { track.sourceNode.disconnect() } catch {}
      track.sourceNode = null
    }
    if (track.gainNode) {
      try { track.gainNode.disconnect() } catch {}
      track.gainNode = null
    }
  }

  // ── play : démarrer toutes les pistes dans leur plage ───────────────────
  play(timelineCurrentTime: number): void {
    const ctx = this.getContext()
    ctx.resume()

    this.tracks.forEach((track) => {
      const inRange = timelineCurrentTime >= track.startTime &&
                      timelineCurrentTime <  track.endTime
      if (inRange) {
        this._playTrack(track, timelineCurrentTime)
      }
    })
  }

  // ── pause : couper toutes les pistes proprement ─────────────────────────
  pause(): void {
    this.tracks.forEach((track) => this._stopTrack(track))
  }

  // ── stopAll : arrêt total (retour à t=0) ────────────────────────────────
  stopAll(): void {
    this.tracks.forEach((track) => this._stopTrack(track))
  }

  // ── seekAll : couper pendant le scrub (pas de lecture pendant le seek) ──
  seekAll(_timelineTime: number): void {
    this.tracks.forEach((track) => this._stopTrack(track))
    // La reprise se fait via play() si isPlaying
  }

  // ── syncToTime : appelé chaque tick RAF ─────────────────────────────────
  // Démarre/arrête les pistes selon leur plage de clip
  syncToTime(timelineCurrentTime: number): void {
    this.tracks.forEach((track) => {
      const inRange = timelineCurrentTime >= track.startTime &&
                      timelineCurrentTime <  track.endTime

      if (inRange && !track.sourceNode) {
        this._playTrack(track, timelineCurrentTime)
      } else if (!inRange && track.sourceNode) {
        this._stopTrack(track)
      }
    })
  }

  getDuration(id: string): number {
    return this.tracks.get(id)?.buffer.duration ?? 0
  }
}

export const audioManager = new AudioManager()
