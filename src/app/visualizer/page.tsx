"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/hooks/useAudio";
import { DeezerSearch } from "@/components/DeezerSearch";
import { AudioUploader } from "@/components/AudioUploader";
import { PlaybackControls } from "@/components/PlaybackControls";
import { VisualizerCanvas, VISUALIZERS } from "@/components/SpectrumVisualizer";
import type { DeezerTrack } from "@/lib/types";

export default function VisualizerPage() {
  const audio = useAudio({
    onError: (msg) => setError(msg),
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackInfo, setTrackInfo] = useState<{
    title: string;
    artist?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vizIndex, setVizIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Auto-hide controls in fullscreen after 3s of no mouse movement
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
      // Start hide timer
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

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen flex-col bg-black"
      onMouseMove={resetHideTimer}
    >
      {/* Visualizer Canvas — full background */}
      <div className="absolute inset-0">
        <VisualizerCanvas
          getData={audio.getData}
          isPlaying={audio.isPlaying}
          visualizerIndex={vizIndex}
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
            {/* Top: Search + Upload */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 p-4 sm:gap-4 sm:p-6"
            >
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Klangfarbe
              </h1>

              <DeezerSearch onSelect={handleDeezerSelect} />

              {!isFullscreen && (
                <AudioUploader onFileSelect={handleFileSelect} />
              )}

              {/* Error message */}
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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom: Playback Controls + Fullscreen */}
            {trackInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-center gap-4 p-4 sm:p-6"
              >
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

                {/* Visualizer switcher */}
                <div className="mb-0.5 flex gap-1 rounded-lg bg-zinc-900/60 p-1">
                  {VISUALIZERS.map((v, i) => (
                    <button
                      key={v.name}
                      onClick={() => setVizIndex(i)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        i === vizIndex
                          ? "bg-white text-black"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
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
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
