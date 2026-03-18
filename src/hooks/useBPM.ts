"use client";

import { useCallback, useRef, useState } from "react";

const HISTORY_SIZE = 200; // ~3.3 seconds at 60fps
const MIN_BPM = 70;
const MAX_BPM = 160;

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
    // Almost pure bass — kick drums live here
    const value = energy.low;

    energyHistory.current.push(value);
    if (energyHistory.current.length > HISTORY_SIZE) {
      energyHistory.current.shift();
    }

    const hist = energyHistory.current;
    if (hist.length < 90) return; // Need 1.5s of history

    const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
    const variance = hist.reduce((a, b) => a + (b - avg) ** 2, 0) / hist.length;
    const stdDev = Math.sqrt(variance);

    // Higher threshold: avg + 2 standard deviations
    const threshold = avg + stdDev * 2;

    // Minimum interval — no faster than MAX_BPM
    const minInterval = (60 / MAX_BPM) * 1000;

    if (value > threshold && now - lastBeatRef.current > minInterval) {
      lastBeatRef.current = now;
      beatTimes.current.push(now);

      // Keep last 8 seconds
      while (beatTimes.current.length > 0 && now - beatTimes.current[0] > 8000) {
        beatTimes.current.shift();
      }

      const beats = beatTimes.current;
      if (beats.length >= 8) {
        const intervals: number[] = [];
        for (let i = 1; i < beats.length; i++) {
          intervals.push(beats[i] - beats[i - 1]);
        }

        // Use median to ignore outliers
        const medianInterval = median(intervals);
        let detectedBpm = Math.round(60000 / medianInterval);

        // If BPM is way too high, it's likely double-counting
        // Most dance music is 100-140 BPM
        if (detectedBpm > MAX_BPM) {
          detectedBpm = Math.round(detectedBpm / 2);
        }

        if (detectedBpm >= MIN_BPM && detectedBpm <= MAX_BPM) {
          setBpm(detectedBpm);
        }
      }
    }
  }, []);

  return { bpm, detect };
}
