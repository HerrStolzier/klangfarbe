import type { VisualizerRenderer, AnalyserData, VisualizerState } from "./types";
import { colorSchemes, getHue } from "./colors";
import * as particles from "./particles";

// Smoothed waveform data for silky movement
const smooth = new Float32Array(256);

export const waveform: VisualizerRenderer = {
  name: "Waveform",

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AnalyserData | null,
    state: VisualizerState,
  ) {
    // Full clear for clean look (no trails)
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    if (!data) {
      return;
    }

    const scheme = colorSchemes[state.colorSchemeIndex] ?? colorSchemes[0];
    const { waveform: wave, energy } = data;
    const intensity = energy.low * 0.5 + energy.mid * 0.3 + energy.high * 0.2;
    const centerY = height * 0.45;

    // Smooth the waveform data
    const sampleCount = 256;
    const step = wave.length / sampleCount;
    for (let i = 0; i < sampleCount; i++) {
      const raw = (wave[Math.floor(i * step)] - 128) / 128;
      smooth[i] += (raw - smooth[i]) * 0.4;
    }

    const amplitude = height * (0.15 + intensity * 0.2);
    const { hue, saturation } = getHue(scheme, energy, 0.5);
    const { hue: hue2 } = getHue(scheme, energy, 1);
    const lightness = 50 + intensity * 25;

    // === Main filled waveform ===
    // Top edge path
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    for (let i = 0; i < sampleCount; i++) {
      const x = (i / (sampleCount - 1)) * width;
      const y = centerY + smooth[i] * amplitude;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        const px = ((i - 1) / (sampleCount - 1)) * width;
        const py = centerY + smooth[i - 1] * amplitude;
        ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
      }
    }
    // Close to bottom
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    // Gradient fill
    const fillGrad = ctx.createLinearGradient(0, centerY - amplitude, 0, height);
    fillGrad.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`);
    fillGrad.addColorStop(0.3, `hsla(${hue}, ${saturation}%, ${lightness - 10}%, 0.3)`);
    fillGrad.addColorStop(0.7, `hsla(${hue2}, ${saturation}%, ${lightness - 20}%, 0.08)`);
    fillGrad.addColorStop(1, "transparent");
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // === Glowing edge line ===
    ctx.save();
    ctx.shadowColor = `hsla(${hue}, 100%, ${lightness}%, 0.9)`;
    ctx.shadowBlur = 15 + intensity * 30;
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness + 15}%, 0.9)`;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    for (let i = 0; i < sampleCount; i++) {
      const x = (i / (sampleCount - 1)) * width;
      const y = centerY + smooth[i] * amplitude;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const px = ((i - 1) / (sampleCount - 1)) * width;
        const py = centerY + smooth[i - 1] * amplitude;
        ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
      }
    }
    ctx.stroke();
    ctx.restore();

    // === Second glow pass (wider, dimmer) for bloom effect ===
    ctx.save();
    ctx.shadowColor = `hsla(${hue}, 100%, ${lightness}%, 0.5)`;
    ctx.shadowBlur = 40 + intensity * 40;
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`;
    ctx.lineWidth = 4;

    ctx.beginPath();
    for (let i = 0; i < sampleCount; i++) {
      const x = (i / (sampleCount - 1)) * width;
      const y = centerY + smooth[i] * amplitude;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const px = ((i - 1) / (sampleCount - 1)) * width;
        const py = centerY + smooth[i - 1] * amplitude;
        ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
      }
    }
    ctx.stroke();
    ctx.restore();

    // === Horizontal scan lines for texture ===
    ctx.save();
    ctx.globalAlpha = 0.03 + intensity * 0.04;
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`;
    ctx.lineWidth = 0.5;
    const lineSpacing = 4;
    for (let y = centerY; y < height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // === Beat flash ===
    if (state.beatIntensity > 0.8) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(state.beatIntensity - 0.8) * 0.08})`;
      ctx.fillRect(0, 0, width, height);
    }

    // === Particles along the wave edge ===
    if (state.beatIntensity > 0.6) {
      for (let i = 0; i < sampleCount; i += 12) {
        if (Math.abs(smooth[i]) > 0.4 && Math.random() > 0.7) {
          const x = (i / (sampleCount - 1)) * width;
          const y = centerY + smooth[i] * amplitude;
          particles.spawn(x, y, hue + Math.random() * 20, 1, 1.5, 2);
        }
      }
    }

    particles.updateAndDraw(ctx, state.deltaTime);
  },
};
