"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyserData } from "@/lib/visualizers/types";

const FFT_SIZE = 2048;

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

export type AudioSource = "file" | "mic" | null;

interface UseAudioOptions {
  onError?: (message: string) => void;
}

export function useAudio(options: UseAudioOptions = {}) {
  // Stabilize options via ref to prevent re-render cascades
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const frequencyRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const waveformRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [source, setSource] = useState<AudioSource>(null);

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

  // Disconnect any active mic
  const stopMic = useCallback(() => {
    if (micSourceRef.current) {
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  }, []);

  // Disconnect any active file source
  const stopFile = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  }, []);

  const load = useCallback(
    (url: string) => {
      stopMic();
      stopFile();
      const { ctx, analyser } = ensureContext();

      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = url;

      audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
      audio.addEventListener("durationchange", () => {
        if (isFinite(audio.duration)) setDuration(audio.duration);
      });
      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
        // Some streams only report duration after playback starts
        if (isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
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
        optionsRef.current.onError?.(msg);
        setIsPlaying(false);
      });

      const src = ctx.createMediaElementSource(audio);
      src.connect(analyser);
      sourceRef.current = src;
      audioRef.current = audio;

      setSource("file");
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    },
    [ensureContext, stopMic, stopFile],
  );

  const startMic = useCallback(async () => {
    stopFile();
    stopMic();
    const { analyser } = ensureContext();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = ctxRef.current!;
      const micSource = ctx.createMediaStreamSource(stream);
      micSource.connect(analyser);

      // Disconnect analyser from destination so we don't hear feedback
      analyser.disconnect();

      micStreamRef.current = stream;
      micSourceRef.current = micSource;
      setSource("mic");
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(0);
    } catch {
      options.onError?.("Mikrofonzugriff verweigert.");
    }
  }, [ensureContext, stopFile, stopMic]);

  const stopMicInput = useCallback(() => {
    stopMic();
    // Reconnect analyser to destination for file playback
    const analyser = analyserRef.current;
    const ctx = ctxRef.current;
    if (analyser && ctx) {
      try {
        analyser.connect(ctx.destination);
      } catch {
        // already connected
      }
    }
    setSource(null);
    setIsPlaying(false);
  }, [stopMic]);

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

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close();
    };
  }, []);

  return {
    load,
    play,
    pause,
    seek,
    getData,
    startMic,
    stopMic: stopMicInput,
    isPlaying,
    currentTime,
    duration,
    source,
  };
}
