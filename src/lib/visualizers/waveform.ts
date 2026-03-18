import type { VisualizerRenderer, AnalyserData, VisualizerState } from "./types";
import { colorSchemes, getHue } from "./colors";
import * as particles from "./particles";

const HISTORY_SIZE = 8;
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
    // Darker fade for cleaner trails
    ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
    ctx.fillRect(0, 0, width, height);

    if (!data) {
      particles.updateAndDraw(ctx, state.deltaTime);
      return;
    }

    const scheme = colorSchemes[state.colorSchemeIndex] ?? colorSchemes[0];
    const { waveform: wave, energy } = data;
    const intensity = energy.low * 0.5 + energy.mid * 0.3 + energy.high * 0.2;
    const centerY = height / 2;

    // Higher sample count for smoother curves
    const sampleCount = 200;
    const step = wave.length / sampleCount;
    const current = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      current[i] = (wave[Math.floor(i * step)] - 128) / 128;
    }

    history.unshift(current);
    while (history.length > HISTORY_SIZE) history.pop();

    // Beat flash
    if (state.beatIntensity > 0.85) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(state.beatIntensity - 0.85) * 0.1})`;
      ctx.fillRect(0, 0, width, height);
    }

    const amplitude = height * (0.18 + intensity * 0.18);

    // Draw filled waveform layers (back to front)
    for (let h = history.length - 1; h >= 0; h--) {
      const frame = history[h];
      const age = h / HISTORY_SIZE;

      const { hue: baseHue, saturation } = getHue(scheme, energy, 0.5);
      const hue = baseHue + h * 12;
      const lightness = 50 + intensity * 30;

      // Build the curve path
      ctx.save();

      // Filled gradient area (main layer and one behind it)
      if (h <= 1) {
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let i = 0; i < frame.length; i++) {
          const x = (i / (frame.length - 1)) * width;
          const y = centerY + frame[i] * amplitude;
          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = ((i - 1) / (frame.length - 1)) * width;
            const prevY = centerY + frame[i - 1] * amplitude;
            ctx.quadraticCurveTo(prevX, prevY, (prevX + x) / 2, (prevY + y) / 2);
          }
        }
        ctx.lineTo(width, centerY);
        ctx.closePath();

        const fillGrad = ctx.createLinearGradient(0, centerY - amplitude, 0, centerY + amplitude);
        const fillAlpha = h === 0 ? 0.25 : 0.08;
        fillGrad.addColorStop(0, `hsla(${hue + 20}, ${saturation}%, ${lightness}%, ${fillAlpha})`);
        fillGrad.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness - 10}%, ${fillAlpha * 0.5})`);
        fillGrad.addColorStop(1, `hsla(${hue - 20}, ${saturation}%, ${lightness}%, ${fillAlpha})`);
        ctx.fillStyle = fillGrad;
        ctx.fill();
      }

      // Stroke line on top
      const strokeAlpha = (1 - age) * (h === 0 ? 0.9 : 0.4);
      ctx.globalAlpha = strokeAlpha;
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`;
      ctx.shadowColor = `hsla(${hue}, 100%, ${lightness}%, ${h === 0 ? 0.8 : 0.3})`;
      ctx.shadowBlur = h === 0 ? 20 + intensity * 25 : 8;
      ctx.lineWidth = h === 0 ? 2.5 : 1;
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

      // Mirror filled area (main layer only, subtle)
      if (h === 0) {
        ctx.globalAlpha = 0.12;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let i = 0; i < frame.length; i++) {
          const x = (i / (frame.length - 1)) * width;
          const y = centerY - frame[i] * amplitude * 0.4;
          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = ((i - 1) / (frame.length - 1)) * width;
            const prevY = centerY - frame[i - 1] * amplitude * 0.4;
            ctx.quadraticCurveTo(prevX, prevY, (prevX + x) / 2, (prevY + y) / 2);
          }
        }
        ctx.lineTo(width, centerY);
        ctx.closePath();

        const mirrorGrad = ctx.createLinearGradient(0, centerY, 0, centerY - amplitude * 0.4);
        mirrorGrad.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.15)`);
        mirrorGrad.addColorStop(1, "transparent");
        ctx.fillStyle = mirrorGrad;
        ctx.fill();
      }

      ctx.restore();
    }

    // Particles at peaks
    if (state.beatIntensity > 0.7 && history[0]) {
      const frame = history[0];
      const { hue } = getHue(scheme, energy, 0.5);
      for (let i = 0; i < frame.length; i += 10) {
        if (Math.abs(frame[i]) > 0.5 && Math.random() > 0.6) {
          const x = (i / (frame.length - 1)) * width;
          const y = centerY + frame[i] * amplitude;
          particles.spawn(x, y, hue + Math.random() * 30, 2, 2, 3);
        }
      }
    }

    particles.updateAndDraw(ctx, state.deltaTime);
  },
};
