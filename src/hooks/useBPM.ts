"use client";

import { useCallback, useRef, useState } from "react";

const HISTORY_SIZE = 240; // ~4 seconds at 60fps
const MIN_BPM = 70;
const MAX_BPM = 160;

function interquartileMean(arr: number[]): number {
  if (arr.length < 4) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  const sorted = [...arr].sort((a, b) => a - b);
  const q1 = Math.floor(sorted.length * 0.25);
  const q3 = Math.ceil(sorted.length * 0.75);
  const trimmed = sorted.slice(q1, q3);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export function useBPM() {
  const energyHistory = useRef<number[]>([]);
  const beatTimes = useRef<number[]>([]);
  const lastBeatRef = useRef(0);
  const stableBpmRef = useRef(0);
  const [bpm, setBpm] = useState<number | null>(null);

  const reset = useCallback(() => {
    energyHistory.current = [];
    beatTimes.current = [];
    lastBeatRef.current = 0;
    stableBpmRef.current = 0;
    setBpm(null);
  }, []);

  const detect = useCallback((energy: { low: number; mid: number; high: number }) => {
    const now = performance.now();
    const value = energy.low;

    energyHistory.current.push(value);
    if (energyHistory.current.length > HISTORY_SIZE) {
      energyHistory.current.shift();
    }

    const hist = energyHistory.current;
    if (hist.length < 90) return;

    const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
    const variance = hist.reduce((a, b) => a + (b - avg) ** 2, 0) / hist.length;
    const stdDev = Math.sqrt(variance);

    // Adaptive threshold: avg + 2 standard deviations
    const threshold = avg + stdDev * 2;
    const minInterval = (60 / MAX_BPM) * 1000;

    if (value > threshold && now - lastBeatRef.current > minInterval) {
      lastBeatRef.current = now;
      beatTimes.current.push(now);

      // Keep last 10 seconds
      while (beatTimes.current.length > 0 && now - beatTimes.current[0] > 10000) {
        beatTimes.current.shift();
      }

      const beats = beatTimes.current;
      if (beats.length >= 8) {
        const intervals: number[] = [];
        for (let i = 1; i < beats.length; i++) {
          intervals.push(beats[i] - beats[i - 1]);
        }

        // Interquartile mean: discard bottom 25% and top 25%
        const avgInterval = interquartileMean(intervals);
        let detectedBpm = Math.round(60000 / avgInterval);

        // Auto-halve if double-counting
        if (detectedBpm > MAX_BPM) {
          detectedBpm = Math.round(detectedBpm / 2);
        }

        if (detectedBpm >= MIN_BPM && detectedBpm <= MAX_BPM) {
          // Stabilization: only update if >5% different from current
          const diff = Math.abs(detectedBpm - stableBpmRef.current);
          const threshold = stableBpmRef.current * 0.05;

          if (stableBpmRef.current === 0 || diff > threshold) {
            stableBpmRef.current = detectedBpm;
            setBpm(detectedBpm);
          }
        }
      }
    }
  }, []);

  return { bpm, detect, reset };
}
