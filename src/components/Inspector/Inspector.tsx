// Inspector — propriétés de l'objet sélectionné
import { useEffect, useState, useCallback } from 'react'
import { Canvas as FabricCanvas, FabricObject } from 'fabric'
import { useObjectStore } from '../../store/objectStore'
import { useTimelineStore } from '../../store/timelineStore'
import { useUIStore } from '../../store/uiStore'
import { AnimationTrack } from '../../types'
import { audioManager } from '../../engine/audioManager'
import styles from './Inspector.module.css'

interface InspectorProps {
  fabricCanvas: FabricCanvas | null
}

const PROPRIETES_ANIMABLES: { key: AnimationTrack['property']; label: string }[] = [
  { key: 'x', label: 'Position X' },
  { key: 'y', label: 'Position Y' },
  { key: 'opacity', label: 'Opacité' },
  { key: 'scaleX', label: 'Échelle X' },
  { key: 'scaleY', label: 'Échelle Y' },
  { key: 'angle', label: 'Rotation' },
]

export default function Inspector({ fabricCanvas }: InspectorProps) {
  const { objects, selectedObjectId, updateObject } = useObjectStore()
  const { tracks, addTrack, addKeyframe, currentTime } = useTimelineStore()
  const { activeFormat, setActiveFormat, setDirty, inspectorRefreshKey } = useUIStore()

  const objetSelectionne = objects.find((o) => o.id === selectedObjectId)

  // Valeurs locales des propriétés Fabric
  const [props, setProps] = useState({
    x: 0, y: 0, width: 0, height: 0,
    opacity: 100, angle: 0, fill: '#8b5cf6',
  })

  // Lire les propriétés de l'objet Fabric sélectionné
  const lireProps = useCallback(() => {
    if (!fabricCanvas || !selectedObjectId) return
    const objs = fabricCanvas.getObjects() as FabricObject[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = objs.find((o) => (o as any).motionId === selectedObjectId)
    if (!obj) return

    setProps({
      x: Math.round(obj.left ?? 0),
      y: Math.round(obj.top ?? 0),
      width: Math.round((obj.width ?? 0) * (obj.scaleX ?? 1)),
      height: Math.round((obj.height ?? 0) * (obj.scaleY ?? 1)),
      opacity: Math.round((obj.opacity ?? 1) * 100),
      angle: Math.round(obj.angle ?? 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fill: (typeof (obj as any).fill === 'string' ? (obj as any).fill : '#8b5cf6') || '#8b5cf6',
    })
  // inspectorRefreshKey déclenche la re-lecture depuis le canvas lors d'un drag
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas, selectedObjectId, inspectorRefreshKey])

  useEffect(() => {
    lireProps()
    if (!fabricCanvas) return
    fabricCanvas.on('object:modified', lireProps)
    fabricCanvas.on('object:moving', lireProps)
    fabricCanvas.on('object:scaling', lireProps)
    fabricCanvas.on('object:rotating', lireProps)
    fabricCanvas.on('selection:created', lireProps)
    fabricCanvas.on('selection:updated', lireProps)
    return () => {
      fabricCanvas.off('object:modified', lireProps)
      fabricCanvas.off('object:moving', lireProps)
      fabricCanvas.off('object:scaling', lireProps)
      fabricCanvas.off('object:rotating', lireProps)
      fabricCanvas.off('selection:created', lireProps)
      fabricCanvas.off('selection:updated', lireProps)
    }
  }, [fabricCanvas, lireProps])

  // Appliquer une modification de propriété sur l'objet Fabric
  function appliquerProp(prop: string, value: number | string) {
    if (!fabricCanvas || !selectedObjectId) return
    const objs = fabricCanvas.getObjects() as FabricObject[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = objs.find((o) => (o as any).motionId === selectedObjectId)
    if (!obj) return

    if (prop === 'x') obj.set('left', value as number)
    else if (prop === 'y') obj.set('top', value as number)
    else if (prop === 'opacity') obj.set('opacity', (value as number) / 100)
    else if (prop === 'fill') obj.set('fill' as keyof FabricObject, value as never)
    else obj.set(prop as keyof FabricObject, value as never)

    obj.setCoords()
    fabricCanvas.renderAll()
    setDirty(true)
  }

  // Ajouter un keyframe pour une propriété à currentTime
  function ajouterKeyframe(property: AnimationTrack['property']) {
    if (!selectedObjectId || !fabricCanvas) return

    // S'assurer que la piste existe
    addTrack(selectedObjectId, property)

    // Lire la valeur actuelle
    const objs = fabricCanvas.getObjects() as FabricObject[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = objs.find((o) => (o as any).motionId === selectedObjectId)
    if (!obj) return

    let valeur: number
    if (property === 'x') valeur = obj.left ?? 0
    else if (property === 'y') valeur = obj.top ?? 0
    else if (property === 'opacity') valeur = (obj.opacity ?? 1)
    else if (property === 'scaleX') valeur = obj.scaleX ?? 1
    else if (property === 'scaleY') valeur = obj.scaleY ?? 1
    else valeur = obj.angle ?? 0

    // Trouver la piste
    const piste = tracks.find(
      (t) => t.objectId === selectedObjectId && t.property === property
    )
    const pisteId = piste?.id

    if (pisteId) {
      addKeyframe(pisteId, {
        time: currentTime,
        value: valeur,
        easing: 'power2.out',
      })
    } else {
      // La piste sera créée par addTrack, ajouter après un tick
      setTimeout(() => {
        const nouvellePiste = useTimelineStore
          .getState()
          .tracks.find((t) => t.objectId === selectedObjectId && t.property === property)
        if (nouvellePiste) {
          addKeyframe(nouvellePiste.id, {
            time: currentTime,
            value: valeur,
            easing: 'power2.out',
          })
        }
      }, 50)
    }
  }

  // Helpers pour lire les propriétés texte depuis Fabric
  const getFabricProp = (prop: string): unknown => {
    if (!fabricCanvas || !selectedObjectId) return undefined
    const obj = fabricCanvas.getObjects().find((o) => (o as any).motionId === selectedObjectId)
    return obj?.get(prop as keyof FabricObject)
  }

  const getFontSize   = (): number => (getFabricProp('fontSize')   as number)  ?? 32
  const getFontWeight = (): string => (getFabricProp('fontWeight') as string)  ?? 'normal'
  const getFontStyle  = (): string => (getFabricProp('fontStyle')  as string)  ?? 'normal'
  const getTextColor  = (): string => {
    const fill = getFabricProp('fill')
    return typeof fill === 'string' ? fill : '#e2e8f0'
  }

  // Affichage si aucun objet sélectionné : propriétés du canvas
  if (!objetSelectionne) {
    return (
      <div className={styles.inspector}>
        <div className={styles.header}>Canvas</div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Format</div>
          <div className={styles.row}>
            <span className={styles.label}>Format</span>
            <span style={{ fontSize: 11, color: '#e2e8f0' }}>{activeFormat.label}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Largeur</span>
            <span style={{ fontSize: 11, color: '#e2e8f0' }}>{activeFormat.width}px</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Hauteur</span>
            <span style={{ fontSize: 11, color: '#e2e8f0' }}>{activeFormat.height}px</span>
          </div>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Fond</div>
          <div className={styles.row}>
            <span className={styles.label}>Couleur</span>
            <input
              type="color"
              className={styles.colorInput}
              value={
                typeof fabricCanvas?.backgroundColor === 'string'
                  ? fabricCanvas.backgroundColor
                  : '#1a1f2e'
              }
              onChange={(e) => {
                if (fabricCanvas) {
                  fabricCanvas.backgroundColor = e.target.value
                  fabricCanvas.renderAll()
                  setDirty(true)
                }
              }}
            />
          </div>
        </div>
        <div className={styles.empty}>
          Sélectionnez un objet<br />pour voir ses propriétés
        </div>
      </div>
    )
  }

  return (
    <div className={styles.inspector}>
      <div className={styles.header}>Propriétés</div>

      {/* Nom de l'objet */}
      <div className={styles.section}>
        <input
          className={styles.inputNom}
          value={objetSelectionne.name}
          onChange={(e) => {
            updateObject(objetSelectionne.id, { name: e.target.value })
            setDirty(true)
          }}
        />
      </div>

      {/* Section Audio — visible pour vidéo et audio */}
      {(objetSelectionne.type === 'video' || objetSelectionne.type === 'audio') && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Audio</div>
          <div className={styles.row}>
            <span className={styles.label}>Volume</span>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={100}
              value={Math.round((objetSelectionne.volume ?? 1) * 100)}
              onChange={(e) => {
                const vol = Number(e.target.value) / 100
                updateObject(objetSelectionne.id, { volume: vol })
                // Appliquer en temps réel
                if (objetSelectionne.type === 'audio') {
                  audioManager.updateTrack(objetSelectionne.id, { volume: vol })
                } else if (fabricCanvas) {
                  const objs = fabricCanvas.getObjects()
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const fabricObj = objs.find((o) => (o as any).motionId === objetSelectionne.id)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const videoEl = (fabricObj as any)?._videoEl as HTMLVideoElement | undefined
                  if (videoEl) videoEl.volume = vol
                }
                setDirty(true)
              }}
            />
            <span style={{ fontSize: 11, color: '#e2e8f0', width: 34, flexShrink: 0 }}>
              {Math.round((objetSelectionne.volume ?? 1) * 100)}%
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Son</span>
            <button
              className={`${styles.toggleBtn} ${objetSelectionne.muted ? styles.active : ''}`}
              onClick={() => {
                const newMuted = !(objetSelectionne.muted ?? false)
                updateObject(objetSelectionne.id, { muted: newMuted })
                if (objetSelectionne.type === 'audio') {
                  audioManager.updateTrack(objetSelectionne.id, { muted: newMuted })
                } else if (fabricCanvas) {
                  const objs = fabricCanvas.getObjects()
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const fabricObj = objs.find((o) => (o as any).motionId === objetSelectionne.id)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const videoEl = (fabricObj as any)?._videoEl as HTMLVideoElement | undefined
                  if (videoEl) videoEl.muted = newMuted
                }
                setDirty(true)
              }}
            >
              {objetSelectionne.muted ? '🔇 Muet' : '🔊 Actif'}
            </button>
          </div>
        </div>
      )}

      {/* Position et taille — masqué pour pistes audio (pas d'objet Fabric) */}
      {objetSelectionne.type !== 'audio' && (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Transformation</div>
        <div className={styles.row}>
          <span className={styles.label}>X</span>
          <input
            type="number"
            className={styles.input}
            value={props.x}
            onChange={(e) => {
              const v = Number(e.target.value)
              setProps((p) => ({ ...p, x: v }))
              appliquerProp('x', v)
            }}
          />
          <span className={styles.label}>Y</span>
          <input
            type="number"
            className={styles.input}
            value={props.y}
            onChange={(e) => {
              const v = Number(e.target.value)
              setProps((p) => ({ ...p, y: v }))
              appliquerProp('y', v)
            }}
          />
        </div>
        <div className={styles.row}>
          <span className={styles.label}>W</span>
          <input
            type="number"
            className={styles.input}
            value={props.width}
            min={1}
            onChange={(e) => {
              const v = Math.max(1, Number(e.target.value))
              setProps((p) => ({ ...p, width: v }))
              if (!fabricCanvas || !selectedObjectId) return
              const objs = fabricCanvas.getObjects() as FabricObject[]
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const obj = objs.find((o) => (o as any).motionId === selectedObjectId)
              if (!obj || !obj.width) return
              obj.set('scaleX', v / obj.width)
              obj.setCoords()
              fabricCanvas.renderAll()
              setDirty(true)
            }}
          />
          <span className={styles.label}>H</span>
          <input
            type="number"
            className={styles.input}
            value={props.height}
            min={1}
            onChange={(e) => {
              const v = Math.max(1, Number(e.target.value))
              setProps((p) => ({ ...p, height: v }))
              if (!fabricCanvas || !selectedObjectId) return
              const objs = fabricCanvas.getObjects() as FabricObject[]
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const obj = objs.find((o) => (o as any).motionId === selectedObjectId)
              if (!obj || !obj.height) return
              obj.set('scaleY', v / obj.height)
              obj.setCoords()
              fabricCanvas.renderAll()
              setDirty(true)
            }}
          />
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Angle</span>
          <input
            type="number"
            className={styles.input}
            value={props.angle}
            onChange={(e) => {
              const v = Number(e.target.value)
              setProps((p) => ({ ...p, angle: v }))
              appliquerProp('angle', v)
            }}
          />
          <span style={{ fontSize: 11, color: '#64748b' }}>°</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Opacité</span>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={100}
            value={props.opacity}
            onChange={(e) => {
              const v = Number(e.target.value)
              setProps((p) => ({ ...p, opacity: v }))
              appliquerProp('opacity', v)
            }}
          />
          <span style={{ fontSize: 11, color: '#e2e8f0', width: 30 }}>{props.opacity}%</span>
        </div>

        {/* Couleur de fond pour rect/circle */}
        {(objetSelectionne.type === 'rect' || objetSelectionne.type === 'circle') && (
          <div className={styles.row}>
            <span className={styles.label}>Couleur</span>
            <input
              type="color"
              className={styles.colorInput}
              value={props.fill}
              onChange={(e) => {
                setProps((p) => ({ ...p, fill: e.target.value }))
                appliquerProp('fill', e.target.value)
              }}
            />
          </div>
        )}
      </div>
      )}

      {/* Section Texte */}
      {objetSelectionne.type === 'text' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Texte</div>

          <div className={styles.row}>
            <span className={styles.label}>Couleur</span>
            <input
              type="color"
              className={styles.colorInput}
              value={getTextColor()}
              onChange={(e) => {
                appliquerProp('fill', e.target.value)
                setProps((p) => ({ ...p, fill: e.target.value }))
              }}
            />
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Taille</span>
            <input
              type="number"
              className={styles.input}
              min={8} max={200}
              value={getFontSize()}
              onChange={(e) => {
                const size = parseInt(e.target.value)
                if (!fabricCanvas || !selectedObjectId || isNaN(size)) return
                const obj = fabricCanvas.getObjects().find((o) => (o as any).motionId === selectedObjectId)
                if (!obj) return
                obj.set('fontSize' as keyof FabricObject, size as never)
                obj.setCoords()
                fabricCanvas.renderAll()
                setDirty(true)
              }}
            />
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Style</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                style={{
                  fontWeight: 'bold',
                  background: getFontWeight() === 'bold' ? 'rgba(139,92,246,0.3)' : 'transparent',
                  border: '1px solid #1e293b', color: '#e2e8f0',
                  borderRadius: 4, padding: '2px 10px', cursor: 'pointer',
                }}
                onClick={() => {
                  if (!fabricCanvas || !selectedObjectId) return
                  const obj = fabricCanvas.getObjects().find((o) => (o as any).motionId === selectedObjectId)
                  if (!obj) return
                  const next = getFontWeight() === 'bold' ? 'normal' : 'bold'
                  obj.set('fontWeight' as keyof FabricObject, next as never)
                  fabricCanvas.renderAll()
                  setDirty(true)
                }}
              >B</button>
              <button
                style={{
                  fontStyle: 'italic',
                  background: getFontStyle() === 'italic' ? 'rgba(139,92,246,0.3)' : 'transparent',
                  border: '1px solid #1e293b', color: '#e2e8f0',
                  borderRadius: 4, padding: '2px 10px', cursor: 'pointer',
                }}
                onClick={() => {
                  if (!fabricCanvas || !selectedObjectId) return
                  const obj = fabricCanvas.getObjects().find((o) => (o as any).motionId === selectedObjectId)
                  if (!obj) return
                  const next = getFontStyle() === 'italic' ? 'normal' : 'italic'
                  obj.set('fontStyle' as keyof FabricObject, next as never)
                  fabricCanvas.renderAll()
                  setDirty(true)
                }}
              >I</button>
            </div>
          </div>
        </div>
      )}

      {/* Visibilité et verrouillage */}
      <div className={styles.section}>
        <div className={styles.toggleRow}>
          <button
            className={`${styles.toggleBtn} ${objetSelectionne.visible ? styles.active : ''}`}
            onClick={() => {
              const v = !objetSelectionne.visible
              updateObject(objetSelectionne.id, { visible: v })
              if (fabricCanvas) {
                const objs = fabricCanvas.getObjects() as FabricObject[]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const obj = objs.find((o) => (o as any).motionId === selectedObjectId)
                if (obj) {
                  obj.visible = v
                  fabricCanvas.renderAll()
                }
              }
              setDirty(true)
            }}
          >
            {objetSelectionne.visible ? '👁' : '👁‍🗨'} Visible
          </button>
          <button
            className={`${styles.toggleBtn} ${objetSelectionne.locked ? styles.active : ''}`}
            onClick={() => {
              const v = !objetSelectionne.locked
              updateObject(objetSelectionne.id, { locked: v })
              if (fabricCanvas) {
                const objs = fabricCanvas.getObjects() as FabricObject[]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const obj = objs.find((o) => (o as any).motionId === selectedObjectId)
                if (obj) {
                  obj.selectable = !v
                  obj.evented = !v
                }
              }
              setDirty(true)
            }}
          >
            {objetSelectionne.locked ? '🔒' : '🔓'} Verrouillé
          </button>
        </div>
      </div>

      {/* Section keyframes — masqué pour pistes audio */}
      {objetSelectionne.type !== 'audio' && (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Keyframes — t={currentTime.toFixed(2)}s</div>
        {PROPRIETES_ANIMABLES.map(({ key, label }) => (
          <button
            key={key}
            className={styles.keyframeBtn}
            onClick={() => ajouterKeyframe(key)}
            title={`Ajouter un keyframe pour ${label} à t=${currentTime.toFixed(2)}s`}
          >
            <span>{label}</span>
            <span className={styles.keyframeIcon}>◆ Ajouter</span>
          </button>
        ))}
      </div>
      )}
    </div>
  )
}
