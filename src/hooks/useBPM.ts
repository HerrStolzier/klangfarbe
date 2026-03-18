"use client";

import { useCallback, useRef, useState } from "react";

const HISTORY_SIZE = 180; // ~3 seconds at 60fps
const MIN_BPM = 60;
const MAX_BPM = 180;

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function useBPM() {
  const energyHistory = useRef<number[]>([]);
  const beatTimes = useRef<number[]>([]);
  const lastBeatRef = useRef(0);
  const [bpm, setBpm] = useState<number | null>(null);

  const detect = useCallback((energy: { low: number; mid: number; high: number }) => {
    const now = performance.now();
    // Focus on low frequencies for beat detection
    const value = energy.low * 0.85 + energy.mid * 0.15;

    energyHistory.current.push(value);
    if (energyHistory.current.length > HISTORY_SIZE) {
      energyHistory.current.shift();
    }

    const hist = energyHistory.current;
    if (hist.length < 60) return; // Need more history before detecting

    // Calculate average and variance for adaptive threshold
    const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
    const variance = hist.reduce((a, b) => a + (b - avg) ** 2, 0) / hist.length;
    const stdDev = Math.sqrt(variance);

    // Adaptive threshold: average + 1.5 standard deviations
    const threshold = avg + stdDev * 1.5;

    // Minimum interval between beats (for MAX_BPM)
    const minInterval = (60 / MAX_BPM) * 1000;

    if (value > threshold && now - lastBeatRef.current > minInterval) {
      lastBeatRef.current = now;
      beatTimes.current.push(now);

      // Keep only recent beats (last 8 seconds)
      while (beatTimes.current.length > 0 && now - beatTimes.current[0] > 8000) {
        beatTimes.current.shift();
      }

      // Need at least 6 beats for reliable BPM
      const beats = beatTimes.current;
      if (beats.length >= 6) {
        const intervals: number[] = [];
        for (let i = 1; i < beats.length; i++) {
          intervals.push(beats[i] - beats[i - 1]);
        }

        // Use median interval (robust against outliers)
        const medianInterval = median(intervals);
        const detectedBpm = Math.round(60000 / medianInterval);

        if (detectedBpm >= MIN_BPM && detectedBpm <= MAX_BPM) {
          setBpm(detectedBpm);
        }
      }
    }
  }, []);

  return { bpm, detect };
}
