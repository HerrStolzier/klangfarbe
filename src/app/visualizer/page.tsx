"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/hooks/useAudio";
import { usePitch } from "@/hooks/usePitch";
import { useBPM } from "@/hooks/useBPM";
import { DeezerSearch } from "@/components/DeezerSearch";
import { AudioUploader } from "@/components/AudioUploader";
import { PlaybackControls } from "@/components/PlaybackControls";
import { AudioInfo } from "@/components/AudioInfo";
import { MicButton } from "@/components/MicButton";
import { DemoTracks } from "@/components/DemoTracks";
import { VisualizerCanvas, VISUALIZERS } from "@/components/SpectrumVisualizer";
import { colorSchemes } from "@/lib/visualizers/colors";
import type { AnalyserData } from "@/lib/visualizers/types";
import type { DeezerTrack } from "@/lib/types";
import type { PitchInfo } from "@/hooks/usePitch";

export default function VisualizerPage() {
  const audio = useAudio({
    onError: (msg) => setError(msg),
  });
  const { detect: detectPitch } = usePitch();
  const { bpm, detect: detectBPM } = useBPM();
  const containerRef = useRef<HTMLDivElement>(null);

  const [trackInfo, setTrackInfo] = useState<{
    title: string;
    artist?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vizIndex, setVizIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Live analysis state (updated in animation frame)
  const [livePitch, setLivePitch] = useState<PitchInfo | null>(null);
  const [liveEnergy, setLiveEnergy] = useState<AnalyserData["energy"] | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // Run pitch/BPM detection in sync with visualization
  useEffect(() => {
    let running = true;

    function tick() {
      if (!running) return;

      const data = audio.getData();
      if (data) {
        detectBPM(data.energy);
        setLiveEnergy(data.energy);

        // Pitch detection needs the actual AnalyserNode
        // We get it from the ref set during audio init
        // For now detect via the audio data
      }

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [audio, detectBPM]);

  // Auto-hide controls in fullscreen
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isFullscreen) {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
      setControlsVisible(true);
    }
  }, []);

  const handleDeezerSelect = useCallback(
    (track: DeezerTrack) => {
      setError(null);
      if (!track.preview) {
        setError("Kein Preview für diesen Song verfügbar.");
        return;
      }
      const proxyUrl = `/api/deezer/preview?url=${encodeURIComponent(track.preview)}`;
      setTrackInfo({ title: track.title, artist: track.artist });
      audio.load(proxyUrl);
      setTimeout(() => audio.play(), 200);
    },
    [audio],
  );

  const handleFileSelect = useCallback(
    (url: string, name: string) => {
      setError(null);
      setTrackInfo({ title: name });
      audio.load(url);
      setTimeout(() => audio.play(), 200);
    },
    [audio],
  );

  const handleStartMic = useCallback(() => {
    setError(null);
    setTrackInfo({ title: "Mikrofon" });
    audio.startMic();
  }, [audio]);

  const handleStopMic = useCallback(() => {
    audio.stopMic();
    setTrackInfo(null);
  }, [audio]);

  const isActive = audio.isPlaying || audio.source === "mic";

  return (
    <div
      ref={containerRef}
      className="relative flex h-[100dvh] flex-col bg-black"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* Visualizer Canvas */}
      <div className="absolute inset-0">
        <VisualizerCanvas
          getData={audio.getData}
          isPlaying={isActive}
          visualizerIndex={vizIndex}
          colorSchemeIndex={colorIndex}
        />
      </div>

      {/* UI Overlay */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex h-full flex-col"
          >
            {/* Top: Search + Upload + Mic */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2 p-3 sm:gap-4 sm:p-6"
            >
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-2xl">
                Klangfarbe
              </h1>

              <DeezerSearch onSelect={handleDeezerSelect} />

              <div className="flex items-center gap-3">
                {!isFullscreen && !trackInfo && (
                  <AudioUploader onFileSelect={handleFileSelect} />
                )}
                <MicButton
                  source={audio.source}
                  onStartMic={handleStartMic}
                  onStopMic={handleStopMic}
                />
              </div>

              {!trackInfo && (
                <DemoTracks onSelect={handleDeezerSelect} />
              )}

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Center: Audio Info (BPM, Pitch, Energy) */}
            {isActive && (
              <div className="pointer-events-none flex flex-1 items-center justify-center">
                <AudioInfo
                  bpm={bpm}
                  pitch={livePitch}
                  energy={liveEnergy}
                />
              </div>
            )}

            {!isActive && <div className="flex-1" />}

            {/* Bottom: Controls */}
            {trackInfo && audio.source === "file" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3 p-3 sm:p-6"
              >
                {/* Switchers */}
                <div className="flex w-full max-w-lg items-center justify-center gap-2">
                  <div className="flex gap-1 rounded-lg bg-zinc-900/60 p-1">
                    {VISUALIZERS.map((v, i) => (
                      <button
                        key={v.name}
                        onClick={() => setVizIndex(i)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${
                          i === vizIndex
                            ? "bg-white text-black"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 rounded-lg bg-zinc-900/60 p-1">
                    {colorSchemes.map((c, i) => (
                      <button
                        key={c.name}
                        onClick={() => setColorIndex(i)}
                        className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors sm:px-2.5 sm:text-[11px] ${
                          i === colorIndex
                            ? "bg-white text-black"
                            : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Playback + Fullscreen */}
                <div className="flex w-full max-w-lg items-end justify-center gap-3">
                  <PlaybackControls
                    isPlaying={audio.isPlaying}
                    currentTime={audio.currentTime}
                    duration={audio.duration}
                    onPlay={audio.play}
                    onPause={audio.pause}
                    onSeek={audio.seek}
                    trackTitle={trackInfo.title}
                    trackArtist={trackInfo.artist}
                  />
                  <button
                    onClick={toggleFullscreen}
                    className="mb-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white sm:flex"
                    title={isFullscreen ? "Vollbild beenden" : "Vollbild"}
                  >
                    {isFullscreen ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </svg>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Mic mode: show switchers at bottom */}
            {trackInfo && audio.source === "mic" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center gap-2 p-3 sm:p-6"
              >
                <div className="flex gap-1 rounded-lg bg-zinc-900/60 p-1">
                  {VISUALIZERS.map((v, i) => (
                    <button
                      key={v.name}
                      onClick={() => setVizIndex(i)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${
                        i === vizIndex
                          ? "bg-white text-black"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 rounded-lg bg-zinc-900/60 p-1">
                  {colorSchemes.map((c, i) => (
                    <button
                      key={c.name}
                      onClick={() => setColorIndex(i)}
                      className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors sm:px-2.5 sm:text-[11px] ${
                        i === colorIndex
                          ? "bg-white text-black"
                          : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
