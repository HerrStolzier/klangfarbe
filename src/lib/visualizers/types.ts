export interface AnalyserData {
  frequency: Uint8Array<ArrayBuffer>;
  waveform: Uint8Array<ArrayBuffer>;
  energy: { low: number; mid: number; high: number };
}

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
