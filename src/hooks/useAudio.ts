"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FFT_SIZE = 2048;

export interface AnalyserData {
  frequency: Uint8Array<ArrayBuffer>;
  waveform: Uint8Array<ArrayBuffer>;
  energy: { low: number; mid: number; high: number };
}

function computeEnergy(frequency: Uint8Array<ArrayBuffer>): {
  low: number;
  mid: number;
  high: number;
} {
  const binCount = frequency.length;
  const lowEnd = Math.floor(250 / (44100 / FFT_SIZE));
  const midEnd = Math.floor(4000 / (44100 / FFT_SIZE));

  let low = 0;
  let mid = 0;
  let high = 0;

  for (let i = 0; i < binCount; i++) {
    if (i < lowEnd) low += frequency[i];
    else if (i < midEnd) mid += frequency[i];
    else high += frequency[i];
  }

  low = low / (lowEnd * 255);
  mid = mid / ((midEnd - lowEnd) * 255);
  high = high / ((binCount - midEnd) * 255);

  return { low, mid, high };
}

interface UseAudioOptions {
  onError?: (message: string) => void;
}

export function useAudio(options: UseAudioOptions = {}) {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frequencyRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const waveformRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Ensure AudioContext + AnalyserNode exist (lazy init)
  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(ctx.destination);

      ctxRef.current = ctx;
      analyserRef.current = analyser;
      frequencyRef.current = new Uint8Array(analyser.frequencyBinCount);
      waveformRef.current = new Uint8Array(analyser.fftSize);
    }

    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }

    return {
      ctx: ctxRef.current,
      analyser: analyserRef.current!,
    };
  }, []);

  const load = useCallback(
    (url: string) => {
      const { ctx, analyser } = ensureContext();

      // Cleanup previous audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = url;

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
        const msg =
          audio.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
            ? "Format nicht unterstützt. Versuche MP3, WAV oder OGG."
            : audio.error?.code === MediaError.MEDIA_ERR_NETWORK
              ? "Netzwerkfehler beim Laden der Audiodatei."
              : "Audiodatei konnte nicht geladen werden.";
        options.onError?.(msg);
        setIsPlaying(false);
      });

      // Connect: audio → source → analyser → destination
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      sourceRef.current = source;
      audioRef.current = audio;

      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    },
    [ensureContext],
  );

  const play = useCallback(async () => {
    if (!audioRef.current) return;
    const { ctx } = ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e) {
      console.error("Play failed:", e);
    }
  }, [ensureContext]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const getData = useCallback((): AnalyserData | null => {
    const analyser = analyserRef.current;
    const frequency = frequencyRef.current;
    const waveform = waveformRef.current;

    if (!analyser || !frequency || !waveform) return null;

    analyser.getByteFrequencyData(frequency);
    analyser.getByteTimeDomainData(waveform);

    return {
      frequency,
      waveform,
      energy: computeEnergy(frequency),
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      ctxRef.current?.close();
    };
  }, []);

  return {
    load,
    play,
    pause,
    seek,
    getData,
    isPlaying,
    currentTime,
    duration,
  };
}
