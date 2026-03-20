import type { AnalyserData } from "@/hooks/useAudio";

// Re-export for backwards compatibility
export type { AnalyserData };

export interface VisualizerState {
  time: number;
  deltaTime: number;
  beatIntensity: number;
  prevEnergy: number;
  colorSchemeIndex: number;
}

export interface VisualizerRenderer {
  name: string;
  draw: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AnalyserData | null,
    state: VisualizerState,
  ) => void;
}
