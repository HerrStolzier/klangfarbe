"use client";

import { useCallback, useRef, useState } from "react";

interface UseAudioPlayerOptions {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
}

export function useAudioPlayer({ audioContext, analyser }: UseAudioPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const load = useCallback(
    (url: string) => {
      if (!audioContext || !analyser) return;

      // Cleanup previous
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = url;

      // Only create source node once per element
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      sourceRef.current = source;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audio.addEventListener("error", () => {
        setIsPlaying(false);
      });

      audioRef.current = audio;
      setIsPlaying(false);
      setCurrentTime(0);
    },
    [audioContext, analyser],
  );

  const play = useCallback(async () => {
    if (!audioRef.current || !audioContext) return;
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    await audioRef.current.play();
    setIsPlaying(true);
  }, [audioContext]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  return { load, play, pause, seek, isPlaying, currentTime, duration };
}
