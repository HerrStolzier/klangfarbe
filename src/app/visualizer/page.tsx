"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAudioContext } from "@/hooks/useAudioContext";
import { useAnalyser } from "@/hooks/useAnalyser";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { DeezerSearch } from "@/components/DeezerSearch";
import { AudioUploader } from "@/components/AudioUploader";
import { PlaybackControls } from "@/components/PlaybackControls";
import { SpectrumVisualizer } from "@/components/SpectrumVisualizer";
import type { DeezerTrack } from "@/lib/types";

export default function VisualizerPage() {
  const { getContext } = useAudioContext();
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const { getAnalyser, getData } = useAnalyser(audioContext);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [trackInfo, setTrackInfo] = useState<{
    title: string;
    artist?: string;
  } | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    const ctx = getContext();
    setAudioContext(ctx);
    const analyser = getAnalyser();
    analyserRef.current = analyser;
    setIsStarted(true);
    return { ctx, analyser };
  }, [getContext, getAnalyser]);

  // We need to lazily init the player since it depends on context/analyser
  const player = useAudioPlayer({
    audioContext,
    analyser: analyserRef.current,
  });

  const handleDeezerSelect = useCallback(
    (track: DeezerTrack) => {
      let audio = audioContext;
      let analyser = analyserRef.current;

      if (!audio || !analyser) {
        const init = initAudio();
        audio = init.ctx;
        analyser = init.analyser;
      }

      // Proxy the preview URL through our API route
      const proxyUrl = `/api/deezer/preview?url=${encodeURIComponent(track.preview)}`;
      // Need to reload player with new context if just initialized
      setTrackInfo({ title: track.title, artist: track.artist });

      // Small delay to let state propagate
      requestAnimationFrame(() => {
        player.load(proxyUrl);
        // Auto-play after loading
        setTimeout(() => player.play(), 100);
      });
    },
    [audioContext, initAudio, player],
  );

  const handleFileSelect = useCallback(
    (url: string, name: string) => {
      if (!audioContext) {
        initAudio();
      }

      setTrackInfo({ title: name });

      requestAnimationFrame(() => {
        player.load(url);
        setTimeout(() => player.play(), 100);
      });
    },
    [audioContext, initAudio, player],
  );

  return (
    <div className="relative flex h-screen flex-col bg-black">
      {/* Visualizer Canvas — full background */}
      <div className="absolute inset-0">
        <SpectrumVisualizer getData={getData} isPlaying={player.isPlaying} />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Top: Search + Upload */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 p-6"
        >
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Klangfarbe
          </h1>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <DeezerSearch onSelect={handleDeezerSelect} />
          </div>

          <AudioUploader onFileSelect={handleFileSelect} />
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom: Playback Controls */}
        {isStarted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center p-6"
          >
            <PlaybackControls
              isPlaying={player.isPlaying}
              currentTime={player.currentTime}
              duration={player.duration}
              onPlay={player.play}
              onPause={player.pause}
              onSeek={player.seek}
              trackTitle={trackInfo?.title}
              trackArtist={trackInfo?.artist}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
