# Klangfarbe

Audio visualizer web app — "See what music looks like."

## Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Transitions:** Framer Motion
- **Visualization:** Canvas 2D (Spectrum, Waveform, Radial) + Three.js (Immersive)
- **3D:** Three.js, @react-three/fiber, @react-three/postprocessing
- **Audio:** Web Audio API (AnalyserNode), Pitchy (pitch detection)
- **Audio Source:** Deezer API (30s previews) + file upload + microphone
- **Hosting:** Vercel (auto-deploy on push to main)
- **Package Manager:** pnpm

## Commands
- `pnpm dev` — Start dev server (localhost:3000)
- `pnpm build` — Production build
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript type-check
- `pnpm test:unit` — Vitest Unit Tests (audio-utils, bpm-utils, colors)
- `pnpm test` — Playwright E2E tests
- `vercel --prod --yes` — Deploy to production

## CI/CD & Quality
- GitHub Actions: Lint + Type-Check + Vitest Unit Tests + Build on push/PR
- Pre-commit hook: `.husky/pre-commit` → `pnpm lint`

## Architecture
- `src/app/` — Next.js pages (landing, visualizer, impressum, datenschutz, sitemap, robots)
- `src/app/api/deezer/` — CORS proxy routes for Deezer API (search + preview)
- `src/components/` — React components (flat structure)
- `src/hooks/` — Audio hooks (useAudio, useBPM, usePitch, useExport)
- `src/lib/visualizers/` — Canvas 2D renderers (spectrum, waveform, radial, colors, particles)
- `src/lib/audio-utils.ts` — Audio-Hilfsfunktionen (FFT-Binning, Frequency-to-Note, Energy-Berechnung)
- `src/lib/bpm-utils.ts` — BPM-Detection-Utilities (Peak-Detection, Onset-Filterung, Adaptive Threshold)
- `src/lib/types.ts` — Shared types (DeezerTrack)
- `src/components/LandingContent.tsx` — Landing-Page-Inhalt (Feature-Cards, Demo, CTA-Section)
- `src/__tests__/` — Vitest Unit Tests (audio-utils.test.ts, bpm-utils.test.ts, colors.test.ts)

## Key Files
- `src/hooks/useAudio.ts` — Audio pipeline: context, analyser, playback, mic, FFT. Uses refs internally (not state) to avoid timing issues. Options stabilized via `optionsRef` pattern.
- `src/components/ImmersiveVisualizer.tsx` — Three.js particle sphere (6000 points, Fibonacci distribution). Dynamic import with `ssr: false`. Audio data pumped via refs, zero React re-renders.
- `src/components/SpectrumVisualizer.tsx` — Canvas 2D render loop + beat detection + mode switching. Exposes canvas via `forwardRef`/`useImperativeHandle` for export.
- `src/lib/visualizers/types.ts` — `VisualizerRenderer` interface: pure function `(ctx, width, height, data, state) → void`
- `src/app/api/deezer/preview/route.ts` — Proxies Deezer preview MP3s with Content-Length + Accept-Ranges headers

## Conventions
- German UI text, English code/comments
- Canvas 2D visualizer renderers are pure functions — no internal state, no classes
- Three.js components use refs for audio data (never React state at 60fps)
- Demo tracks searched live via Deezer API on click (no hardcoded preview URLs — they expire)
- Error states for: mic permission denied, corrupt audio, unsupported format

## Gotchas
- **Deezer CORS:** API and preview MP3s have no CORS headers — all requests go through Next.js API route proxies
- **Deezer CDN domains:** Preview URLs use both `cdns-preview-*.dzcdn.net` AND `cdnt-preview.dzcdn.net` — proxy validation must allow both
- **Options ref pattern:** `useAudio` stabilizes the `options` parameter via `optionsRef` — without this, the inline `{ onError }` object causes infinite re-render cascades that reset audio state
- **Audio duration on mobile:** Deezer preview streams don't always report duration via `loadedmetadata`. Four listeners (`loadedmetadata`, `durationchange`, `loadeddata`, `canplay`) + `preload="auto"` + explicit `Content-Length` header in proxy needed
- **Mobile keyboard:** Viewport uses `interactiveWidget: "overlays-content"` + container `fixed inset-0` to prevent keyboard from pushing the visualizer up
- **Browser autoplay:** AudioContext starts suspended — must call resume() on user interaction
- **BPM detection:** Uses pure bass energy (`energy.low`) with adaptive threshold (avg + 2*stddev). Auto-halves if >160 to correct double-counting. Not reliable for non-percussive music.

## Known Limitations
- Video export (captureStream + MediaRecorder) not available in Safari — PNG screenshot works everywhere
- Deezer previews are 30 seconds max — full songs require file upload
- Immersive mode (Three.js) not available during SSR — loaded via `next/dynamic`
