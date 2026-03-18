# Klangfarbe

Audio visualizer web app — "See what music looks like."

## Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Transitions:** Framer Motion
- **Visualization:** Canvas 2D (Phase 1), Three.js + GLSL (Phase 2+)
- **Audio:** Web Audio API (AnalyserNode)
- **Hosting:** Vercel
- **Package Manager:** pnpm

## Commands
- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm lint` — ESLint

## Architecture
- `src/app/` — Next.js App Router pages
- `src/components/` — React components (flat, grows organically)
- `src/hooks/` — Audio hooks (useAudioContext, useAnalyser, useFFT, etc.)
- `src/lib/` — Utilities and helpers

## Conventions
- German UI text, English code/comments
- Canvas 2D for Phase 1 visualizers, Three.js introduced in Phase 2
- Audio hooks are built for Klangfarbe first, extracted as library later
- Demo tracks loaded from CDN, never committed to repo
- Error states for: mic permission denied, corrupt audio, unsupported format

## Known Limitations
- Video export (captureStream + MediaRecorder) not available in Safari — PNG fallback
- Mobile: reduced visualizer complexity, user interaction required before audio playback
- BPM detection less reliable for jazz/classical (works well for electronic/pop)
