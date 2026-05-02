# Changelog

All notable changes to this project are documented here. Pin **git commit** or release tags for reproducible research deployments (see README).

## [1.0.0] — 2026-05-02

### Summary

First documented release line for the production research app at [map.synapticfour.com](https://map.synapticfour.com).

### Features

- **Adaptive assessment**: Ten-dimensional routing (F–V), core + refinement phases, confidence-based stopping (research threshold 0.75), optional early completion when all dimensions reach threshold during core.
- **Cognitive landscape**: Shared latent projection (PCA) with map, density, cognitive field, 3D terrain, and vector views; archetype anchors and synthetic reference cloud; optional session-local pattern hints.
- **Internationalization**: English, German, and additional locale drafts (Wolof, Twi/Akan); consent-first flows and ethics-aware copy.
- **Research data**: Browser-local and optional Supabase pipeline storage; research session ZIP export; cohort insights (when enabled); group profile comparison tool.
- **Field / offline**: Bundled question bank, IndexedDB, paper/CSV replay at `/field-import`.
- **Share links**: Encoded cognitive profile payload in URL (`?p=` or hash `#p=`) with safe length limits; JSON export.

### Technical stack

- Next.js 16, React 19, TypeScript, Tailwind CSS, MIT License.
