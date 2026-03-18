import type { VisualizerRenderer, AnalyserData, VisualizerState } from "./types";
import { colorSchemes, getHue } from "./colors";
import * as particles from "./particles";

const HISTORY_SIZE = 6;
const history: Float32Array[] = [];

export const waveform: VisualizerRenderer = {
  name: "Waveform",

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AnalyserData | null,
    state: VisualizerState,
  ) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, width, height);

    if (!data) {
      particles.updateAndDraw(ctx, state.deltaTime);
      return;
    }

    const scheme = colorSchemes[state.colorSchemeIndex] ?? colorSchemes[0];
    const { waveform: wave, energy } = data;
    const intensity = energy.low * 0.5 + energy.mid * 0.3 + energy.high * 0.2;
    const centerY = height / 2;

    const sampleCount = 128;
    const step = wave.length / sampleCount;
    const current = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      current[i] = (wave[Math.floor(i * step)] - 128) / 128;
    }

    history.unshift(current);
    while (history.length > HISTORY_SIZE) history.pop();

    if (state.beatIntensity > 0.85) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(state.beatIntensity - 0.85) * 0.12})`;
      ctx.fillRect(0, 0, width, height);
    }

    for (let h = history.length - 1; h >= 0; h--) {
      const frame = history[h];
      const age = h / HISTORY_SIZE;
      const alpha = (1 - age) * 0.5;
      const hueShift = h * 15;

      const { hue: baseHue, saturation } = getHue(scheme, energy, 0.5);
      const hue = baseHue + hueShift;
      const lightness = 55 + intensity * 25;
      const amplitude = height * (0.2 + intensity * 0.2);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`;
      ctx.shadowColor = `hsla(${hue}, 100%, ${lightness}%, 0.7)`;
      ctx.shadowBlur = 15 + intensity * 20;
      ctx.lineWidth = h === 0 ? 4 : 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      for (let i = 0; i < frame.length; i++) {
        const x = (i / (frame.length - 1)) * width;
        const y = centerY + frame[i] * amplitude;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = ((i - 1) / (frame.length - 1)) * width;
          const prevY = centerY + frame[i - 1] * amplitude;
          ctx.quadraticCurveTo(prevX, prevY, (prevX + x) / 2, (prevY + y) / 2);
        }
      }
      ctx.stroke();

      // Mirror (main layer only)
      if (h === 0) {
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        for (let i = 0; i < frame.length; i++) {
          const x = (i / (frame.length - 1)) * width;
          const y = centerY - frame[i] * amplitude * 0.5;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = ((i - 1) / (frame.length - 1)) * width;
            const prevY = centerY - frame[i - 1] * amplitude * 0.5;
            ctx.quadraticCurveTo(prevX, prevY, (prevX + x) / 2, (prevY + y) / 2);
          }
        }
        ctx.stroke();
      }

      ctx.restore();
    }

    // Center line
    ctx.save();
    const lineGradient = ctx.createLinearGradient(0, centerY, width, centerY);
    const { hue: lineHue, saturation: lineSat } = getHue(scheme, energy, 0.5);
    lineGradient.addColorStop(0, "transparent");
    lineGradient.addColorStop(0.2, `hsla(${lineHue}, ${lineSat}%, 50%, 0.15)`);
    lineGradient.addColorStop(0.8, `hsla(${lineHue}, ${lineSat}%, 50%, 0.15)`);
    lineGradient.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.restore();

    // Particles at peaks
    if (state.beatIntensity > 0.7 && history[0]) {
      const frame = history[0];
      for (let i = 0; i < frame.length; i += 8) {
        if (Math.abs(frame[i]) > 0.6 && Math.random() > 0.7) {
          const x = (i / (frame.length - 1)) * width;
          const y = centerY + frame[i] * height * 0.3;
          const { hue } = getHue(scheme, energy, Math.random());
          particles.spawn(x, y, hue, 2, 2, 2);
        }
      }
    }

    particles.updateAndDraw(ctx, state.deltaTime);
  },
};
