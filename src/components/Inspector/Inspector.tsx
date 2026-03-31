// Inspector — propriétés de l'objet sélectionné
import { useEffect, useState, useCallback } from 'react'
import { Canvas as FabricCanvas, FabricObject, Group as FabricGroup } from 'fabric'
import { useObjectStore } from '../../store/objectStore'
import { useTimelineStore } from '../../store/timelineStore'
import { useUIStore } from '../../store/uiStore'
import { AnimationTrack } from '../../types'
import { audioManager } from '../../engine/audioManager'
import styles from './Inspector.module.css'

interface InspectorProps {
  fabricCanvas: FabricCanvas | null
}

const EASING_OPTIONS = [
  { value: 'linear',              label: '— Linear' },
  { value: 'power1.out',          label: '↘ Ease Out' },
  { value: 'power1.in',           label: '↗ Ease In' },
  { value: 'power1.inOut',        label: '⟨⟩ Ease InOut' },
  { value: 'power2.out',          label: '↘↘ Power2 Out' },
  { value: 'power2.in',           label: '↗↗ Power2 In' },
  { value: 'power2.inOut',        label: '⟨⟨⟩⟩ Power2 InOut' },
  { value: 'power3.out',          label: '↘↘↘ Power3 Out' },
  { value: 'power3.in',           label: '↗↗↗ Power3 In' },
  { value: 'power3.inOut',        label: '⟨⟨⟨⟩⟩⟩ Power3 InOut' },
  { value: 'back.out(1.7)',        label: '↩ Back Out' },
  { value: 'bounce.out',          label: '⤵ Bounce Out' },
  { value: 'elastic.out(1,0.3)',   label: '〜 Elastic Out' },
  { value: 'expo.out',            label: '⤵⤵ Expo Out' },
  { value: 'expo.in',             label: '↑↑ Expo In' },
  { value: 'circ.out',            label: '○ Circ Out' },
  { value: 'circ.inOut',          label: '◎ Circ InOut' },
]

const PROPRIETES_ANIMABLES: { key: AnimationTrack['property']; label: string }[] = [
  { key: 'x', label: 'Position X' },
  { key: 'y', label: 'Position Y' },
  { key: 'opacity', label: 'Opacité' },
  { key: 'scaleX', label: 'Échelle X' },
  { key: 'scaleY', label: 'Échelle Y' },
  { key: 'angle', label: 'Rotation' },
]

export default function Inspector({ fabricCanvas }: InspectorProps) {
  const { objects, selectedObjectId, selectedObjectIds, updateObject, addObject, removeObject, selectMultipleObjects } = useObjectStore()
  const { tracks, addTrack, addKeyframe, updateKeyframe, deleteKeyframe, removeTracksForObject, currentTime } = useTimelineStore()
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

  // Grouper les objets sélectionnés
  function handleGroup() {
    if (!fabricCanvas || selectedObjectIds.length < 2) return
    const activeObjs = fabricCanvas.getActiveObjects()
    if (activeObjs.length < 2) return

    fabricCanvas.discardActiveObject()
    activeObjs.forEach((o) => fabricCanvas.remove(o))

    const groupId = crypto.randomUUID()
    const group = new FabricGroup(activeObjs, {
      selectable: true, evented: true,
      hasControls: true, hasBorders: true,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(group as any).motionId = groupId

    fabricCanvas.add(group)
    fabricCanvas.setActiveObject(group)
    fabricCanvas.renderAll()

    // Retirer les objets individuels du store + leurs pistes
    selectedObjectIds.forEach((id) => {
      removeTracksForObject(id)
      removeObject(id)
    })

    // Ajouter le groupe au store
    const dur = useTimelineStore.getState().duration
    addObject({
      id: groupId, fabricId: groupId,
      name: 'Groupe',
      type: 'group',
      visible: true, locked: false,
      startTime: 0, endTime: dur,
    })
    selectMultipleObjects([groupId])
    setDirty(true)
  }

  // Dégrouper le groupe sélectionné
  function handleUngroup() {
    if (!fabricCanvas || selectedObjectIds.length !== 1) return
    const obj = fabricCanvas.getObjects().find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o) => (o as any).motionId === selectedObjectIds[0]
    )
    if (!obj || obj.type !== 'group') return
    const group = obj as FabricGroup

    // Calculer les transforms absolus de chaque enfant
    const children = [...group.getObjects()]
    fabricCanvas.remove(group)

    const groupId = selectedObjectIds[0]
    removeTracksForObject(groupId)
    removeObject(groupId)

    const dur = useTimelineStore.getState().duration
    const newIds: string[] = []
    children.forEach((child, i) => {
      // Appliquer le transform du groupe sur l'enfant
      const matrix = group.calcTransformMatrix()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(child as any).group = undefined
      child.set({
        left:   (child.left ?? 0) + (matrix[4] ?? 0),
        top:    (child.top  ?? 0) + (matrix[5] ?? 0),
        selectable: true, evented: true,
        hasControls: true, hasBorders: true,
      })
      child.setCoords()

      const childId = crypto.randomUUID()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(child as any).motionId = childId
      fabricCanvas.add(child)

      addObject({
        id: childId, fabricId: childId,
        name: `Objet ${i + 1}`,
        type: 'rect',   // type générique — l'objet Fabric garde son vrai type
        visible: true, locked: false,
        startTime: 0, endTime: dur,
      })
      newIds.push(childId)
    })

    fabricCanvas.renderAll()
    selectMultipleObjects(newIds)
    setDirty(true)
  }

  // Multi-sélection : afficher un panel condensé
  if (selectedObjectIds.length > 1) {
    return (
      <div className={styles.inspector}>
        <div className={styles.header}>Sélection multiple</div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>{selectedObjectIds.length} objets sélectionnés</div>
          <div className={styles.row}>
            <span className={styles.label}>Opacité</span>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={100}
              defaultValue={100}
              onChange={(e) => {
                if (!fabricCanvas) return
                const opacity = Number(e.target.value) / 100
                fabricCanvas.getActiveObjects().forEach((obj) => {
                  obj.set('opacity', opacity)
                })
                fabricCanvas.renderAll()
                setDirty(true)
              }}
            />
          </div>
        </div>
        <div className={styles.section}>
          <button className={styles.keyframeBtn} onClick={handleGroup}>
            <span>Grouper</span>
            <span className={styles.keyframeIcon}>⊞ Groupe</span>
          </button>
        </div>
        <div className={styles.empty}>
          Sélectionnez un seul objet<br />pour voir ses propriétés
        </div>
      </div>
    )
  }

  // Groupe sélectionné → bouton Dégrouper
  const isGroupSelected = objetSelectionne?.type === 'group'

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
        {/* Bouton Dégrouper — uniquement pour les groupes */}
        {isGroupSelected && (
          <button
            className={styles.keyframeBtn}
            style={{ marginTop: 8 }}
            onClick={handleUngroup}
          >
            <span>Dégrouper</span>
            <span className={styles.keyframeIcon}>⊟ Séparer</span>
          </button>
        )}
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
        {PROPRIETES_ANIMABLES.map(({ key, label }) => {
          const piste = tracks.find(
            (t) => t.objectId === selectedObjectId && t.property === key
          )
          return (
            <div key={key} className={styles.kfPropGroup}>
              <button
                className={styles.keyframeBtn}
                onClick={() => ajouterKeyframe(key)}
                title={`Ajouter un keyframe pour ${label} à t=${currentTime.toFixed(2)}s`}
              >
                <span>{label}</span>
                <span className={styles.keyframeIcon}>◆ Ajouter</span>
              </button>
              {piste && [...piste.keyframes]
                .sort((a, b) => a.time - b.time)
                .map((kf) => (
                  <div key={kf.id} className={styles.keyframeRow}>
                    <span className={styles.kfTime}>{kf.time.toFixed(2)}s</span>
                    <span className={styles.kfValue}>
                      {typeof kf.value === 'number' ? kf.value.toFixed(1) : String(kf.value)}
                    </span>
                    <select
                      className={styles.easingSelect}
                      value={kf.easing ?? 'linear'}
                      onChange={(e) => {
                        updateKeyframe(piste.id, kf.id, { easing: e.target.value })
                        setDirty(true)
                      }}
                    >
                      {EASING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      className={styles.kfDeleteBtn}
                      onClick={() => { deleteKeyframe(piste.id, kf.id); setDirty(true) }}
                      title="Supprimer ce keyframe"
                    >✕</button>
                  </div>
                ))
              }
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}
