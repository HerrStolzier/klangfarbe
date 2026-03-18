"use client";

import { useCallback, useRef, useState } from "react";

// Simple BPM detection via beat energy peaks
// We track energy over time and measure intervals between peaks

const HISTORY_SIZE = 120; // ~2 seconds at 60fps
const MIN_BPM = 60;
const MAX_BPM = 200;

export function useBPM() {
  const energyHistory = useRef<number[]>([]);
  const beatTimes = useRef<number[]>([]);
  const lastBeatRef = useRef(0);
  const [bpm, setBpm] = useState<number | null>(null);

  const detect = useCallback((energy: { low: number; mid: number; high: number }) => {
    const now = performance.now();
    const value = energy.low * 0.7 + energy.mid * 0.3;

    energyHistory.current.push(value);
    if (energyHistory.current.length > HISTORY_SIZE) {
      energyHistory.current.shift();
    }

    const hist = energyHistory.current;
    if (hist.length < 30) return;

    // Calculate average energy
    const avg = hist.reduce((a, b) => a + b, 0) / hist.length;

    // Beat if current energy exceeds average by threshold
    // and enough time has passed since last beat (debounce)
    const minInterval = (60 / MAX_BPM) * 1000; // ms
    if (value > avg * 1.4 && now - lastBeatRef.current > minInterval) {
      lastBeatRef.current = now;
      beatTimes.current.push(now);

      // Keep only recent beats (last 10 seconds)
      while (beatTimes.current.length > 0 && now - beatTimes.current[0] > 10000) {
        beatTimes.current.shift();
      }

      // Calculate BPM from intervals
      const beats = beatTimes.current;
      if (beats.length >= 4) {
        const intervals: number[] = [];
        for (let i = 1; i < beats.length; i++) {
          intervals.push(beats[i] - beats[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const detectedBpm = Math.round(60000 / avgInterval);

        if (detectedBpm >= MIN_BPM && detectedBpm <= MAX_BPM) {
          setBpm(detectedBpm);
        }
      }
    }
  }, []);

  return { bpm, detect };
}
