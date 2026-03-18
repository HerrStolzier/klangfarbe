"use client";

import { useCallback, useRef } from "react";

const FFT_SIZE = 2048;

export interface AnalyserData {
  frequency: Uint8Array;
  waveform: Uint8Array;
  energy: { low: number; mid: number; high: number };
}

function computeEnergy(frequency: Uint8Array): {
  low: number;
  mid: number;
  high: number;
} {
  const binCount = frequency.length;
  // Low: 0-250Hz, Mid: 250-4000Hz, High: 4000Hz+
  // With 44100 sample rate and 2048 FFT → each bin ≈ 21.5Hz
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

  // Normalize to 0-1
  low = low / (lowEnd * 255);
  mid = mid / ((midEnd - lowEnd) * 255);
  high = high / ((binCount - midEnd) * 255);

  return { low, mid, high };
}

export function useAnalyser(audioContext: AudioContext | null) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frequencyRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const waveformRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const getAnalyser = useCallback(() => {
    if (!audioContext) return null;

    if (!analyserRef.current) {
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      frequencyRef.current = new Uint8Array(analyser.frequencyBinCount);
      waveformRef.current = new Uint8Array(analyser.fftSize);
    }

    return analyserRef.current;
  }, [audioContext]);

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

  return { getAnalyser, getData };
}
