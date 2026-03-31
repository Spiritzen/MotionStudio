# MotionStudio

Éditeur d'animation web inspiré de Premiere Pro (version light).
Partie de l'écosystème CreaSite : BeatStudio · EasyStudio · MotionStudio.

## Stack
- React 18 + TypeScript + Vite
- Fabric.js (canvas)
- GSAP (animations)
- Zustand (state)
- Web Audio API (audio)

## Lancer le projet
```bash
npm install
npm run dev
```

## Phase 1 — MVP ✅
- Canvas avec objets (rect, cercle, texte, image, vidéo)
- Timeline custom avec clips déplaçables et redimensionnables
- Keyframes drag avec interpolation GSAP
- Play / Pause / Stop / Scrub
- Pistes audio (MP3, WAV) via Web Audio API
- Son vidéo MP4 synchronisé avec la timeline
- Zoom canvas + scroll
- Undo/Redo (Ctrl+Z / Ctrl+Y)
- Sauvegarde localStorage + export .motionstudio
- Formats : YouTube 16:9, TikTok 9:16, Instagram, etc.

## Phase 2 — En cours
- Easing curves éditables
- Multi-sélection et groupes
- Découpe de clips (ciseaux)
- Preview live améliorée

## Auteur
Sébastien Cantrelle — © 2026 CreaSite
