<div align="center">

<img src="public/MotionStudioPreview.jpg" alt="MotionStudio Banner" width="100%"/>

# 🎬 MotionStudio

### Éditeur d'animation web professionnel open source
**Animer · Composer · Synchroniser · Exporter**

[![Live Demo](https://img.shields.io/badge/🌍_Live_Demo-MotionStudio-7c3aed?style=for-the-badge)](https://spiritzen.github.io/MotionStudio/)
[![GitHub](https://img.shields.io/badge/GitHub-Spiritzen-181717?style=for-the-badge&logo=github)](https://github.com/Spiritzen)
[![Portfolio](https://img.shields.io/badge/Portfolio-Sébastien_Cantrelle-1d9e75?style=for-the-badge)](https://spiritzen.github.io/portfolio/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/sebastien-cantrelle-26b695106/)

---

> **MotionStudio** est un éditeur d'animation web professionnel open source,
> inspiré de Premiere Pro et After Effects, 100% front-end, zéro serveur.
> Animez des objets sur canvas, synchronisez audio et vidéo sur une timeline
> professionnelle, et exportez vos projets directement depuis le navigateur.

---

</div>

## 🌍 Demo live

### 👉 [https://spiritzen.github.io/MotionStudio/](https://spiritzen.github.io/MotionStudio/)

---

## ✨ Pourquoi MotionStudio ?

| Besoin | MotionStudio |
|--------|--------------|
| Animer des objets sans installation | ✅ 100% navigateur, zéro plugin |
| Timeline professionnelle avec keyframes | ✅ Clips déplaçables, keyframes drag |
| Importer et animer des vidéos | ✅ MP4 / WebM avec son synchronisé |
| Ajouter une bande sonore | ✅ Import MP3 / WAV via Web Audio API |
| Contrôler précisément les animations | ✅ Interpolation GSAP, easing curves |
| Sauvegarder et reprendre son travail | ✅ Auto-save localStorage + export .motionstudio |
| Travailler sur différents formats | ✅ YouTube, TikTok, Instagram, LinkedIn… |
| Annuler une erreur | ✅ Undo/Redo Ctrl+Z / Ctrl+Y (50 états) |

---

## 🚀 Fonctionnalités

### 🎨 Canvas & Objets
- **Rectangle, Cercle, Texte** — création en un clic, édition inline
- **Import Image** — JPG, PNG, WebP, GIF, SVG
- **Import Vidéo** — MP4, WebM avec rendu canvas en temps réel
- **Sélecteur professionnel** — drag, resize, rotation avec poignées Fabric.js
- **Inspector** — modification X, Y, W, H, angle, opacité, couleur en temps réel
- **Zoom canvas** — de 10% à 200%, Ctrl+molette, scroll H/V si dépassement
- **Formats prédéfinis** — YouTube 16:9 · YouTube Short · TikTok · Instagram · Twitter/X · LinkedIn · Personnalisé

### 🎬 Timeline Professionnelle
- **Clips visuels** — barre colorée par type (purple=rect, amber=circle, blue=text, teal=image, red=vidéo, cyan=audio)
- **Drag & Drop** — déplacer un clip horizontalement pour changer son startTime
- **Resize clips** — étirer les bords gauche/droit pour modifier la durée
- **Scroll horizontal** — accès à toute la durée même sur de longs projets
- **Labels fixes** — noms des pistes restent visibles pendant le scroll
- **Zoom timeline** — slider de 20 à 200px/seconde
- **Piste vide** — créer une piste sans objet canvas
- **Réordonnancement** — drag & drop vertical des pistes

### ⏱️ Keyframes & Animation
- **Keyframes visuels** — losanges ◆ draggables sur chaque piste
- **Propriétés animables** — Position X/Y · Opacité · Échelle X/Y · Rotation
- **Interpolation GSAP** — moteur d'animation ultra-performant
- **Easing** — configuration par keyframe (power2.out, linear…)
- **Ajout depuis l'Inspector** — bouton "◆ Ajouter" par propriété à currentTime

### ▶️ Lecture & Transport
- **Play / Pause / Stop** — contrôles complets
- **Scrubber drag** — navigation précise dans le temps
- **Timecode** — affichage MM:SS:FF (minutes:secondes:frames)
- **Scrubber auto-scroll** — la timeline suit la tête de lecture
- **Sync parfaite** — canvas, vidéos et audio jouent ensemble

### 🔊 Audio
- **Son vidéo MP4** — synchronisé avec la timeline, mute/unmute par piste
- **Import MP3 / WAV / OGG** — pistes audio autonomes via **Web Audio API**
- **Zéro grésillements** — buffer décodé entièrement en mémoire (AudioBufferSourceNode)
- **Volume par piste** — slider 0–100% dans l'Inspector
- **Mute par piste** — bouton 🔊/🔇 dans la timeline
- **Sync multi-pistes** — toutes les pistes audio jouent ensemble sans drift

### 💾 Sauvegarde & Export
- **Auto-save** — sauvegarde localStorage toutes les 30 secondes
- **Sauvegarde manuelle** — Ctrl+S ou bouton "Sauvegarder"
- **Export .motionstudio** — fichier JSON complet (canvas + timeline + keyframes)
- **Import .motionstudio** — restauration fidèle du projet complet
- **Export code GSAP** — génère le code d'animation réutilisable en développement
- **Indicateur isDirty** — point orange si modifications non sauvegardées

### ↩️ Historique
- **Undo** — Ctrl+Z · jusqu'à 50 états en mémoire
- **Redo** — Ctrl+Y ou Ctrl+Shift+Z
- **Boutons visuels** — icônes ↺ ↻ au-dessus de la timeline
- **Protection inputs** — Ctrl+Z dans un champ texte n'affecte pas l'historique canvas

---

## ⌨️ Raccourcis clavier

| Touche | Action |
|--------|--------|
| `Espace` | Play / Pause |
| `Ctrl+Z` | Annuler |
| `Ctrl+Y` | Rétablir |
| `Ctrl+Shift+Z` | Rétablir (alternatif) |
| `Ctrl+S` | Sauvegarder |
| `Ctrl+=` | Zoomer le canvas |
| `Ctrl+-` | Dézoomer le canvas |
| `Ctrl+0` | Canvas à 100% |
| `Ctrl+Molette` | Zoom canvas à la souris |
| `Suppr / Backspace` | Supprimer l'objet sélectionné |
| `Échap` | Désélectionner / Retour au sélecteur |

---

## 🛠 Stack technique

| Technologie | Rôle |
|-------------|------|
| React 18 | Interface composants |
| TypeScript | Typage strict |
| Vite | Build ultra-rapide |
| Fabric.js v6 | Canvas, objets, interactions |
| GSAP | Moteur d'animation, timeline, easing |
| Zustand | State management |
| Web Audio API | Pistes audio MP3/WAV sans grésillements |
| CSS Modules | Styles scopés par composant |
| GitHub Pages | Hébergement gratuit |

---

## 🏗 Architecture

```
src/
├── components/
│   ├── Canvas/
│   │   ├── CanvasEditor.tsx         # Fabric.js, création objets, sélecteur
│   │   └── CanvasEditor.module.css
│   ├── Timeline/
│   │   ├── Timeline.tsx             # Timeline custom scrollable
│   │   ├── TimelineTrack.tsx        # Clip draggable + resize
│   │   ├── Keyframe.tsx             # Losange ◆ draggable
│   │   └── Timeline.module.css
│   ├── Toolbar/
│   │   ├── Toolbar.tsx              # Outils + import image/vidéo/audio
│   │   └── Toolbar.module.css
│   ├── Inspector/
│   │   ├── Inspector.tsx            # Propriétés objet + keyframes + audio
│   │   └── Inspector.module.css
│   ├── PlaybackControls/
│   │   ├── PlaybackControls.tsx     # Play/Pause/Stop/Scrub/Timecode
│   │   └── PlaybackControls.module.css
│   └── ProjectManager/
│       ├── ProjectManager.tsx       # Topbar : nom, save, export, zoom, format
│       └── ProjectManager.module.css
├── engine/
│   ├── animationEngine.ts           # RAF loop, GSAP, sync vidéo/audio
│   ├── audioManager.ts              # Web Audio API, AudioBufferSourceNode
│   ├── keyframeUtils.ts             # Utilitaires keyframes
│   └── interpolation.ts            # Calcul valeur entre 2 keyframes
├── store/
│   ├── objectStore.ts               # MotionObjects (Zustand)
│   ├── timelineStore.ts             # Tracks, currentTime, duration
│   ├── uiStore.ts                   # Tool actif, zoom, format, isDirty
│   └── historyStore.ts              # Undo/Redo (pile past/future)
├── utils/
│   ├── serializer.ts                # serialize/deserialize projet complet
│   ├── storage.ts                   # localStorage + autosave
│   ├── exportJSON.ts                # Export/import .motionstudio
│   └── exportGSAP.ts                # Génération code GSAP
├── types/
│   └── index.ts                     # Interfaces + CANVAS_FORMATS
└── App.tsx                          # Layout principal + routing callbacks
```

---

## ⚙️ Installation locale

```bash
git clone https://github.com/Spiritzen/MotionStudio.git
cd MotionStudio
npm install
npm run dev
```

➡️ Ouvrir **http://localhost:5173/**

---

## 💾 Format de projet `.motionstudio`

Le projet exporté est un fichier JSON complet et portable :

```json
{
  "id": "uuid",
  "name": "Mon projet",
  "version": "1.0.0",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "duration": 10,
  "fps": 30,
  "format": {
    "id": "youtube-169",
    "name": "YouTube",
    "width": 1280,
    "height": 720,
    "label": "YouTube 16:9"
  },
  "canvas": {
    "width": 1280,
    "height": 720,
    "backgroundColor": "#1a1f2e"
  },
  "objects": [
    {
      "id": "uuid",
      "fabricId": "uuid",
      "name": "Rectangle 1",
      "type": "rect",
      "visible": true,
      "locked": false,
      "startTime": 0,
      "endTime": 5,
      "volume": 1,
      "muted": false
    }
  ],
  "fabricJSON": { "...": "snapshot Fabric.js complet" },
  "timeline": [
    {
      "id": "uuid",
      "objectId": "uuid",
      "property": "x",
      "keyframes": [
        { "id": "uuid", "time": 0, "value": 100, "easing": "power2.out" },
        { "id": "uuid", "time": 3, "value": 500, "easing": "power2.out" }
      ]
    }
  ]
}
```

---

## 📋 Changelog

### v1.0.0 — Phase 1 MVP

- ✨ Canvas Fabric.js — rect, cercle, texte, image, vidéo
- ✨ Sélecteur professionnel — drag, resize, rotation avec poignées
- ✨ Timeline custom avec clips colorés déplaçables et redimensionnables
- ✨ Keyframes visuels draggables avec interpolation GSAP
- ✨ Play / Pause / Stop / Scrub avec timecode MM:SS:FF
- ✨ Pistes audio autonomes MP3/WAV via Web Audio API (zéro grésillements)
- ✨ Son vidéo MP4 synchronisé avec la timeline
- ✨ Volume et Mute par piste (vidéo et audio)
- ✨ Zoom canvas 10–200% + scroll H/V + Ctrl+molette
- ✨ Undo/Redo Ctrl+Z / Ctrl+Y (50 états en mémoire)
- ✨ Formats : YouTube 16:9 · YouTube Short · TikTok · Instagram · Twitter/X · LinkedIn · Personnalisé
- ✨ Auto-save localStorage toutes les 30 secondes
- ✨ Export/Import .motionstudio (JSON complet)
- ✨ Export code GSAP réutilisable
- ✨ Charte visuelle dark cohérente avec BeatStudio et EasyStudio

---

## 🎯 Écosystème CreaSite

MotionStudio fait partie d'une suite d'outils créatifs open source :

| Outil | Description | Lien |
|-------|-------------|------|
| 🎛️ **BeatStudio** | Step sequencer professionnel | [GitHub](https://github.com/Spiritzen/BeatStudio) · [Demo](https://spiritzen.github.io/BeatStudio/) |
| 🖼️ **EasyStudio** | Éditeur d'images et vignettes | [GitHub](https://github.com/Spiritzen/EasyStudio) · [Demo](https://spiritzen.github.io/EasyStudio/) |
| 🎬 **MotionStudio** | Éditeur d'animation web | [GitHub](https://github.com/Spiritzen/MotionStudio) · [Demo](https://spiritzen.github.io/MotionStudio/) |

Charte visuelle commune · Stack React/TypeScript/Vite · Format JSON cohérent

---

## 🎯 Philosophie du projet

MotionStudio est né d'une envie simple :
**créer des animations professionnelles directement dans le navigateur, sans installation, sans compte, sans limite.**

- ✅ **Zéro serveur** — tout tourne en local dans le navigateur
- ✅ **Export réel** — projet .motionstudio + code GSAP réutilisable
- ✅ **Audio précis** — Web Audio API, zéro drift, zéro grésillements
- ✅ **Open source** — forkez, adaptez, améliorez
- ✅ **Portfolio-ready** — Fabric.js + GSAP + Web Audio + architecture propre

---

## 👤 Auteur

<div align="center">

### Sébastien Cantrelle
**Développeur Full Stack · DevOps Junior**
*Titre RNCP Niveau 6 — Concepteur Développeur d'Applications*
Amiens, France · Télétravail possible

[![Portfolio](https://img.shields.io/badge/🌍_Portfolio-spiritzen.github.io-7c3aed?style=flat-square)](https://spiritzen.github.io/portfolio/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sébastien_Cantrelle-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/sebastien-cantrelle-26b695106/)
[![GitHub](https://img.shields.io/badge/GitHub-Spiritzen-181717?style=flat-square&logo=github)](https://github.com/Spiritzen)
[![Vidéo](https://img.shields.io/badge/▶_Vidéo-Portfolio-ff4444?style=flat-square&logo=youtube)](https://www.youtube.com/watch?v=DVOQzauF8Es)
[![Email](https://img.shields.io/badge/Email-Contact-1d9e75?style=flat-square)](mailto:sebastien.cantrelle@hotmail.fr)
[![CV](https://img.shields.io/badge/📄_CV-Télécharger-orange?style=flat-square)](https://spiritzen.github.io/portfolio/CV_Sebastien_Cantrelle.pdf)

</div>

---

<div align="center">

**⭐ Si MotionStudio vous est utile, une étoile sur GitHub c'est toujours apprécié !**

*MotionStudio · MIT License · 2026*

</div>
