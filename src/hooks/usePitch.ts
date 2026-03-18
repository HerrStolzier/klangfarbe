"use client";

import { useCallback, useRef, useState } from "react";
import { PitchDetector } from "pitchy";
import type { AnalyserData } from "@/lib/visualizers/types";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function frequencyToNote(freq: number): { note: string; octave: number; cents: number } {
  const semitone = 12 * Math.log2(freq / 440) + 69;
  const rounded = Math.round(semitone);
  const cents = Math.round((semitone - rounded) * 100);
  const note = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return { note, octave, cents };
}

export interface PitchInfo {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  clarity: number;
}

export function usePitch() {
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const floatBufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const [pitch, setPitch] = useState<PitchInfo | null>(null);

  const detect = useCallback((data: AnalyserData | null, analyser: AnalyserNode | null) => {
    if (!data || !analyser) {
      setPitch(null);
      return null;
    }

    // Lazy init detector
    if (!detectorRef.current) {
      detectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);
      floatBufRef.current = new Float32Array(analyser.fftSize);
    }

    const buf = floatBufRef.current!;
    analyser.getFloatTimeDomainData(buf);

    const [freq, clarity] = detectorRef.current.findPitch(buf, analyser.context.sampleRate);

    // Only accept if clarity is high enough and frequency is in musical range
    if (clarity > 0.9 && freq > 60 && freq < 2000) {
      const { note, octave, cents } = frequencyToNote(freq);
      const info: PitchInfo = {
        frequency: Math.round(freq * 10) / 10,
        note,
        octave,
        cents,
        clarity: Math.round(clarity * 100) / 100,
      };
      setPitch(info);
      return info;
    }

    setPitch(null);
    return null;
  }, []);

  return { pitch, detect };
}
