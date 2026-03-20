# Klangfarbe

[![CI](https://github.com/HerrStolzier/klangfarbe/actions/workflows/ci.yml/badge.svg)](https://github.com/HerrStolzier/klangfarbe/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

**See what music looks like.** Real-time audio visualizer in the browser.

Upload a song, search via Deezer, or use your microphone — and watch audio come alive as stunning visual art.

## Features

- **3 Visualizer Modes** — Spectrum (frequency bars), Waveform (organic waves), Radial (circular spectrum)
- **5 Color Schemes** — Neon, Inferno, Ocean, Aurora, Mono
- **Deezer Integration** — Search and play 30-second previews instantly
- **Microphone Input** — Visualize live audio from your mic
- **BPM Detection** — Real-time tempo detection
- **Energy Display** — Low/Mid/High frequency energy bars
- **Export** — PNG screenshots + WebM video recording
- **Keyboard Shortcuts** — Space (play/pause), F (fullscreen), arrows (switch modes)
- **Shareable Settings** — URL parameters preserve your visualizer/color choices
- **Mobile-Ready** — Touch-optimized controls, responsive layout

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion**
- **Web Audio API** (AnalyserNode, FFT)
- **Pitchy** (pitch detection)
- **Canvas 2D** (GPU-accelerated rendering)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `F` | Toggle fullscreen |
| `←` `→` | Switch visualizer mode |
| `↑` `↓` | Switch color scheme |

## Architecture

```
src/
├── app/                    # Next.js pages + API routes
│   ├── api/deezer/         # CORS proxy for Deezer API
│   └── visualizer/         # Main visualizer page
├── components/             # React components
├── hooks/
│   ├── useAudio.ts         # Audio pipeline (context, analyser, playback, mic)
│   ├── useBPM.ts           # Beat detection via energy peaks
│   ├── useExport.ts        # Screenshot + video recording
│   └── usePitch.ts         # Pitch detection (Pitchy/YIN)
└── lib/
    └── visualizers/        # Renderer modules (pure functions)
        ├── spectrum.ts
        ├── waveform.ts
        ├── radial.ts
        ├── colors.ts       # Color scheme definitions
        └── particles.ts    # Shared particle system
```

## License

MIT
