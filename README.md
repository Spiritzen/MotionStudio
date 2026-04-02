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
| Découper des clips comme dans Premiere | ✅ Outil ciseaux ✂️ sur toutes les pistes |
| Gérer plusieurs pistes vidéo | ✅ Multi-pistes avec visibilité par plage |
| Courbes d'animation avancées | ✅ 10+ easings GSAP (bounce, elastic, back…) |
| Sélectionner et grouper des objets | ✅ Multi-sélection, groupes, Ctrl+A |
| Exporter son travail | ✅ MP4/WebM · CSS @keyframes · Code GSAP · .motionstudio |
| Annuler une erreur | ✅ Undo/Redo Ctrl+Z / Ctrl+Y (50 états) |

---

## 🚀 Fonctionnalités

### 🎨 Canvas & Objets
- **Rectangle, Cercle** — création en un clic, couleur personnalisable
- **Texte** — édition inline, couleur, taille, gras, italique
- **Import Image** — JPG, PNG, WebP, GIF, SVG
- **Import Vidéo** — MP4, WebM avec rendu canvas en temps réel
- **Sélecteur professionnel** — drag, resize, rotation avec poignées Fabric.js
- **Inspector** — modification X, Y, W, H, angle, opacité, couleur en temps réel
- **Zoom canvas** — de 10% à 200%, Ctrl+molette, scroll H/V si dépassement
- **Formats** — YouTube 16:9 · YouTube Short · TikTok · Instagram · Twitter/X · LinkedIn · Personnalisé

### 🎬 Timeline Professionnelle
- **Clips visuels** — barre colorée par type
- **Drag & Drop** — déplacer un clip horizontalement
- **Resize clips** — étirer les bords gauche/droit
- **✂️ Outil Ciseaux** — découpe un clip, crée une nouvelle piste automatiquement
- **Multi-pistes vidéo** — visibilité automatique par plage temporelle
- **Scroll horizontal** — accès à toute la durée
- **Réordonnancement** — drag & drop vertical des pistes

### ⏱️ Keyframes & Easing Curves
- **Keyframes visuels** — losanges ◆ draggables sur chaque piste
- **Propriétés animables** — Position X/Y · Opacité · Échelle X/Y · Rotation
- **10+ courbes d'easing GSAP** — linear, ease in/out, power2, power3, back, bounce, elastic, expo, circ
- **Sélecteur par keyframe** — changer l'easing directement dans l'Inspector
- **Interpolation temps réel** — rendu immédiat pendant le scrub

### 🎯 Multi-sélection & Groupes
- **Shift+clic** — sélectionner plusieurs objets
- **Ctrl+A** — sélectionner tous les objets
- **Opacité groupée** — modifier tous les objets sélectionnés
- **Groupes** — grouper/dégrouper, double-clic pour entrer dans un groupe
- **Delete groupé** — supprimer toute la sélection en une fois

### ▶️ Lecture & Transport
- **Play / Pause / Stop** — contrôles complets
- **Scrubber drag** — navigation précise dans le temps
- **Timecode** — affichage MM:SS:FF
- **● EN LECTURE** — indicateur clignotant amber pendant la lecture

### 🔊 Audio
- **Son vidéo MP4** — synchronisé avec la timeline, mute/unmute par piste
- **Import MP3 / WAV / OGG** — pistes audio autonomes via **Web Audio API**
- **Zéro grésillements** — AudioBufferSourceNode, buffer décodé en mémoire
- **Volume par piste** — slider 0–100% dans l'Inspector
- **Mute par piste** — bouton 🔊/🔇 dans la timeline

### 📤 Export Avancé
- **Export .motionstudio** — projet JSON complet avec médias embarqués (base64)
- **Export vidéo** — WebM/MP4 via canvas captureStream, choix FPS (24/30/60), barre de progression
- **Export CSS @keyframes** — fichier .css avec animations par objet
- **Export code GSAP** — gsap.timeline() complet avec easings, copié dans le presse-papier

### ↩️ Historique
- **Undo** — Ctrl+Z (50 états)
- **Redo** — Ctrl+Y ou Ctrl+Shift+Z
- **Boutons visuels** — ↺ ↻ au-dessus de la timeline

---

## ⌨️ Raccourcis clavier

| Touche | Action |
|--------|--------|
| `Espace` | Play / Pause |
| `Ctrl+Z` | Annuler |
| `Ctrl+Y` | Rétablir |
| `Ctrl+A` | Sélectionner tout |
| `S` | Activer l'outil ciseaux |
| `Ctrl+S` | Sauvegarder |
| `Ctrl+=` | Zoomer le canvas |
| `Ctrl+-` | Dézoomer le canvas |
| `Ctrl+0` | Canvas à 100% |
| `Ctrl+Molette` | Zoom canvas |
| `Suppr` | Supprimer l'objet sélectionné |
| `Échap` | Désélectionner / Retour sélecteur |

---

## 🛠 Stack technique

| Technologie | Rôle |
|-------------|------|
| React 18 | Interface composants |
| TypeScript | Typage strict |
| Vite | Build ultra-rapide |
| Fabric.js v6 | Canvas, objets, interactions |
| GSAP | Moteur d'animation, easing curves |
| Zustand | State management |
| Web Audio API | Pistes audio MP3/WAV sans grésillements |
| MediaRecorder API | Export vidéo WebM/MP4 |
| CSS Modules | Styles scopés |
| GitHub Pages + Actions | CI/CD déploiement automatique |

---

## 🏗 Architecture

```
src/
├── components/
│   ├── Canvas/CanvasEditor.tsx        # Fabric.js, master render loop, multi-sélection
│   ├── Timeline/Timeline.tsx          # Timeline scrollable, clips, ciseaux, easing
│   ├── Timeline/TimelineTrack.tsx     # Clip drag/resize par piste
│   ├── Toolbar/Toolbar.tsx            # Outils + import image/vidéo/audio
│   ├── Inspector/Inspector.tsx        # Propriétés, keyframes, easing, groupes
│   ├── PlaybackControls/              # Play/Pause/Stop/Scrub/Timecode
│   ├── ProjectManager/                # Topbar : save, export, zoom, format
│   ├── ExportModal/ExportModal.tsx    # Modale export vidéo avec progression
│   └── Footer/Footer.tsx              # Copyright, version, liens sociaux
├── engine/
│   ├── animationEngine.ts             # RAF loop, GSAP, sync multi-vidéo/audio
│   ├── audioManager.ts                # Web Audio API, multi-pistes indépendantes
│   ├── keyframeUtils.ts               # Utilitaires keyframes
│   └── interpolation.ts              # gsap.parseEase, interpolation entre keyframes
├── store/
│   ├── objectStore.ts                 # MotionObjects, multi-sélection
│   ├── timelineStore.ts               # Tracks, currentTime, duration
│   ├── uiStore.ts                     # Tool actif, zoom, format, timelineMode
│   └── historyStore.ts               # Undo/Redo (50 états)
├── utils/
│   ├── splitClip.ts                   # Logique découpe clips
│   ├── serializer.ts                  # Serialize/deserialize + médias base64
│   ├── storage.ts                     # localStorage + autosave
│   ├── exportJSON.ts                  # Export/import .motionstudio
│   ├── exportGSAP.ts                  # Génération code GSAP complet
│   ├── exportCSS.ts                   # Génération CSS @keyframes
│   ├── exportVideo.ts                 # MediaRecorder canvas captureStream
│   └── audioUtils.ts                  # audioBufferToWav
└── types/index.ts                     # Interfaces + CANVAS_FORMATS
```

---

## ⚙️ Installation locale

```bash
git clone https://github.com/Spiritzen/MotionStudio.git
cd MotionStudio
npm install
npm run dev
```

---

## 📋 Changelog

### v1.1.3 — Phase 3 Export + Footer + Phase 2 Core

**Phase 3 — Export avancé**
- ✨ Export vidéo WebM/MP4 — canvas captureStream, choix FPS 24/30/60, barre de progression
- ✨ Export CSS @keyframes — fichier .css avec animations complètes par objet
- ✨ Export code GSAP — gsap.timeline() avec easings, copié dans le presse-papier
- ✨ Footer professionnel — copyright, version, GitHub, Portfolio, LinkedIn, YouTube, Contact, CV

**Phase 2 — Core features**
- ✨ Easing curves — 10+ courbes GSAP (bounce, elastic, back, expo, circ…) par keyframe
- ✨ Multi-sélection — Shift+clic, Ctrl+A, opacité groupée, delete groupé
- ✨ Groupes — grouper/dégrouper, double-clic pour entrer, clip unique dans la timeline
- ✨ Preview live — indicateur ● EN LECTURE amber clignotant
- ✨ Visibilité hors plage — tous les types (rect, circle, text, image) masqués automatiquement
- ✨ Couleurs Inspector — color picker appliqué en temps réel sur Fabric
- ✨ Style texte — couleur, taille de police, gras, italique

### v1.0.0 — Phase 1 MVP

- ✨ Canvas Fabric.js — rect, cercle, texte, image, vidéo
- ✨ Timeline custom avec clips colorés déplaçables et redimensionnables
- ✨ Keyframes visuels draggables avec interpolation GSAP
- ✨ Play / Pause / Stop / Scrub avec timecode MM:SS:FF
- ✨ Outil Ciseaux ✂️ — découpe tout type de clip
- ✨ Multi-pistes vidéo — master render loop centralisé
- ✨ Pistes audio autonomes MP3/WAV via Web Audio API
- ✨ Son vidéo MP4 synchronisé avec la timeline
- ✨ Zoom canvas 10–200% + scroll H/V
- ✨ Undo/Redo Ctrl+Z / Ctrl+Y (50 états)
- ✨ Formats YouTube, TikTok, Instagram, Twitter/X, LinkedIn, Personnalisé
- ✨ Auto-save localStorage + Export/Import .motionstudio

---

## 🎯 Écosystème CreaSite

| Outil | Description | Lien |
|-------|-------------|------|
| 🎛️ **BeatStudio** | Step sequencer professionnel | [Demo](https://spiritzen.github.io/BeatStudio/) |
| 🖼️ **EasyStudio** | Éditeur d'images et vignettes | [Demo](https://spiritzen.github.io/EasyStudio/) |
| 🎬 **MotionStudio** | Éditeur d'animation web | [Demo](https://spiritzen.github.io/MotionStudio/) |

---

## 👤 Auteur

<div align="center">

### Sébastien Cantrelle
**Développeur Full Stack · DevOps Junior**
*Titre RNCP Niveau 6 — Concepteur Développeur d'Applications*

[![Portfolio](https://img.shields.io/badge/🌍_Portfolio-spiritzen.github.io-7c3aed?style=flat-square)](https://spiritzen.github.io/portfolio/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sébastien_Cantrelle-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/sebastien-cantrelle-26b695106/)
[![GitHub](https://img.shields.io/badge/GitHub-Spiritzen-181717?style=flat-square&logo=github)](https://github.com/Spiritzen)
[![Vidéo](https://img.shields.io/badge/▶_Vidéo-Portfolio-ff0000?style=flat-square&logo=youtube)](https://www.youtube.com/watch?v=DVOQzauF8Es)
[![Email](https://img.shields.io/badge/Email-Contact-1d9e75?style=flat-square)](mailto:sebastien.cantrelle@hotmail.fr)

</div>

---

<div align="center">

**⭐ Si MotionStudio vous est utile, une étoile sur GitHub c'est toujours apprécié !**

*MotionStudio v1.1.3 · MIT License · 2026*

</div>
