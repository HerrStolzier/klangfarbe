"use client";

import { useEffect, useRef, useCallback } from "react";
import type { AnalyserData, VisualizerRenderer, VisualizerState } from "@/lib/visualizers/types";
import { spectrum, waveform, radial } from "@/lib/visualizers";

export const VISUALIZERS: VisualizerRenderer[] = [spectrum, waveform, radial];

interface VisualizerCanvasProps {
  getData: () => AnalyserData | null;
  isPlaying: boolean;
  visualizerIndex: number;
  colorSchemeIndex: number;
}

export function VisualizerCanvas({
  getData,
  isPlaying,
  visualizerIndex,
  colorSchemeIndex,
}: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const stateRef = useRef<VisualizerState>({
    time: 0,
    deltaTime: 0.016,
    beatIntensity: 0,
    prevEnergy: 0,
    colorSchemeIndex: 0,
  });
  const lastTimeRef = useRef<number>(0);
  const visualizerRef = useRef(visualizerIndex);
  visualizerRef.current = visualizerIndex;
  const colorSchemeRef = useRef(colorSchemeIndex);
  colorSchemeRef.current = colorSchemeIndex;

  const getDataRef = useRef(getData);
  getDataRef.current = getData;

  const render = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dt =
      lastTimeRef.current > 0
        ? (timestamp - lastTimeRef.current) / 1000
        : 0.016;
    lastTimeRef.current = timestamp;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const width = rect.width;
    const height = rect.height;

    const data = getDataRef.current();

    // Beat detection
    const state = stateRef.current;
    state.time += dt;
    state.deltaTime = dt;

    if (data) {
      const currentEnergy = data.energy.low;
      const energyDelta = currentEnergy - state.prevEnergy;
      // Beat intensity: spike detection with decay
      if (energyDelta > 0.1) {
        state.beatIntensity = Math.min(1, energyDelta * 5);
      } else {
        state.beatIntensity *= 0.9; // decay
      }
      state.prevEnergy = currentEnergy;
    } else {
      state.beatIntensity *= 0.95;
    }

    // Render current visualizer
    state.colorSchemeIndex = colorSchemeRef.current;
    const renderer = VISUALIZERS[visualizerRef.current] ?? spectrum;
    renderer.draw(ctx, width, height, data, state);

    animationRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ background: "black" }}
    />
  );
}
