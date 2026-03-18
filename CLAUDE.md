# Klangfarbe

Audio visualizer web app — "See what music looks like."

## Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Transitions:** Framer Motion
- **Visualization:** Canvas 2D (3 modes: Spectrum, Waveform, Radial)
- **Audio:** Web Audio API (AnalyserNode)
- **Audio Source:** Deezer API (30s previews) + file upload
- **Hosting:** Vercel
- **Package Manager:** pnpm

## Commands
- `pnpm dev` — Start dev server (localhost:3000)
- `pnpm build` — Production build
- `pnpm lint` — ESLint

## Architecture
- `src/app/` — Next.js App Router pages
- `src/app/api/deezer/` — CORS proxy routes for Deezer API (search + preview)
- `src/components/` — React components (flat structure)
- `src/hooks/useAudio.ts` — Single audio hook (context, analyser, playback, FFT data)
- `src/lib/visualizers/` — Visualizer renderers (spectrum, waveform, radial, shared particles)
- `src/lib/types.ts` — Shared types (DeezerTrack)

## Key Files
- `src/hooks/useAudio.ts` — All audio logic via refs (not state) to avoid timing issues
- `src/lib/visualizers/types.ts` — VisualizerRenderer interface: `(ctx, width, height, data, state) → void`
- `src/components/SpectrumVisualizer.tsx` — Canvas loop + beat detection + visualizer switching
- `src/app/api/deezer/preview/route.ts` — Proxies Deezer preview MP3s to bypass CORS

## Conventions
- German UI text, English code/comments
- Visualizer renderers are pure functions — no internal state, no classes
- Audio hooks built for Klangfarbe first, extracted as library later
- Demo tracks loaded from CDN, never committed to repo
- Error states for: mic permission denied, corrupt audio, unsupported format

## Gotchas
- **Deezer CORS:** API and preview MP3s have no CORS headers — all requests go through Next.js API route proxies
- **Deezer CDN domains:** Preview URLs use both `cdns-preview-*.dzcdn.net` AND `cdnt-preview.dzcdn.net` — proxy validation must allow both
- **AudioContext timing:** useAudio uses refs (not React state) internally because state updates are async and cause null-pointer issues when load() is called immediately after init
- **Browser autoplay:** AudioContext starts suspended — must call resume() on user interaction before playback works

## Known Limitations
- Video export (captureStream + MediaRecorder) not available in Safari — PNG fallback planned
- Mobile: reduced visualizer complexity needed, user interaction required before audio playback
- BPM detection (planned): less reliable for jazz/classical, works well for electronic/pop
- Deezer previews are 30 seconds max — full songs require file upload
