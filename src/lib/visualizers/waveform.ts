import type { VisualizerRenderer, AnalyserData, VisualizerState } from "./types";
import * as particles from "./particles";

// Store previous frames for layered effect
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
    // Dark fade with trail
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, width, height);

    if (!data) {
      particles.updateAndDraw(ctx, state.deltaTime);
      return;
    }

    const { waveform: wave, energy } = data;
    const intensity = energy.low * 0.5 + energy.mid * 0.3 + energy.high * 0.2;
    const centerY = height / 2;

    // Sample the waveform data down for smooth curves
    const sampleCount = 128;
    const step = wave.length / sampleCount;
    const current = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      const idx = Math.floor(i * step);
      current[i] = (wave[idx] - 128) / 128; // -1 to 1
    }

    // Push to history, keep limited
    history.unshift(current);
    while (history.length > HISTORY_SIZE) history.pop();

    // Beat flash
    if (state.beatIntensity > 0.85) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(state.beatIntensity - 0.85) * 0.12})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw history layers (older = more transparent, different hue)
    for (let h = history.length - 1; h >= 0; h--) {
      const frame = history[h];
      const age = h / HISTORY_SIZE;
      const alpha = (1 - age) * 0.5;
      const hueShift = h * 15;

      const baseHue = intensity > 0.5 ? 320 + hueShift : 200 + hueShift; // pink/purple or cyan/blue
      const lightness = 55 + intensity * 25;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `hsla(${baseHue}, 90%, ${lightness}%, 1)`;
      ctx.shadowColor = `hsla(${baseHue}, 100%, ${lightness}%, 0.7)`;
      ctx.shadowBlur = 15 + intensity * 20;
      ctx.lineWidth = h === 0 ? 3 : 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Amplitude scales with energy
      const amplitude = height * (0.2 + intensity * 0.25);

      ctx.beginPath();
      for (let i = 0; i < frame.length; i++) {
        const x = (i / (frame.length - 1)) * width;
        const y = centerY + frame[i] * amplitude;

        if (i === 0) ctx.moveTo(x, y);
        else {
          // Smooth curve through points
          const prevX = ((i - 1) / (frame.length - 1)) * width;
          const prevY = centerY + frame[i - 1] * amplitude;
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
        }
      }
      ctx.stroke();

      // Mirror line (dimmer)
      if (h === 0) {
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        for (let i = 0; i < frame.length; i++) {
          const x = (i / (frame.length - 1)) * width;
          const y = centerY - frame[i] * amplitude * 0.5;

          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = ((i - 1) / (frame.length - 1)) * width;
            const prevY = centerY - frame[i - 1] * amplitude * 0.5;
            const cpX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
          }
        }
        ctx.stroke();
      }

      ctx.restore();
    }

    // Center line glow
    ctx.save();
    const lineGradient = ctx.createLinearGradient(0, centerY, width, centerY);
    const lineHue = intensity > 0.5 ? 320 : 200;
    lineGradient.addColorStop(0, "transparent");
    lineGradient.addColorStop(0.2, `hsla(${lineHue}, 80%, 50%, 0.15)`);
    lineGradient.addColorStop(0.8, `hsla(${lineHue}, 80%, 50%, 0.15)`);
    lineGradient.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.restore();

    // Spawn particles at peaks
    if (state.beatIntensity > 0.7) {
      const frame = history[0];
      if (frame) {
        for (let i = 0; i < frame.length; i += 8) {
          if (Math.abs(frame[i]) > 0.6 && Math.random() > 0.7) {
            const x = (i / (frame.length - 1)) * width;
            const y = centerY + frame[i] * height * 0.3;
            const hue = intensity > 0.5 ? 320 + Math.random() * 40 : 200 + Math.random() * 40;
            particles.spawn(x, y, hue, 2, 2, 2);
          }
        }
      }
    }

    particles.updateAndDraw(ctx, state.deltaTime);
  },
};
