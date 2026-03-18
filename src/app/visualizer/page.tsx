"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useAudio } from "@/hooks/useAudio";
import { DeezerSearch } from "@/components/DeezerSearch";
import { AudioUploader } from "@/components/AudioUploader";
import { PlaybackControls } from "@/components/PlaybackControls";
import { SpectrumVisualizer } from "@/components/SpectrumVisualizer";
import type { DeezerTrack } from "@/lib/types";

export default function VisualizerPage() {
  const audio = useAudio();
  const [trackInfo, setTrackInfo] = useState<{
    title: string;
    artist?: string;
  } | null>(null);

  const handleDeezerSelect = useCallback(
    (track: DeezerTrack) => {
      const proxyUrl = `/api/deezer/preview?url=${encodeURIComponent(track.preview)}`;
      setTrackInfo({ title: track.title, artist: track.artist });
      audio.load(proxyUrl);
      // Auto-play once audio is loaded
      setTimeout(() => audio.play(), 200);
    },
    [audio],
  );

  const handleFileSelect = useCallback(
    (url: string, name: string) => {
      setTrackInfo({ title: name });
      audio.load(url);
      setTimeout(() => audio.play(), 200);
    },
    [audio],
  );

  return (
    <div className="relative flex h-screen flex-col bg-black">
      {/* Visualizer Canvas — full background */}
      <div className="absolute inset-0">
        <SpectrumVisualizer getData={audio.getData} isPlaying={audio.isPlaying} />
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

          <DeezerSearch onSelect={handleDeezerSelect} />
          <AudioUploader onFileSelect={handleFileSelect} />
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom: Playback Controls */}
        {trackInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center p-6"
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
          </motion.div>
        )}
      </div>
    </div>
  );
}
