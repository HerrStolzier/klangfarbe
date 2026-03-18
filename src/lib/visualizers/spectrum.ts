import type { VisualizerRenderer, AnalyserData, VisualizerState } from "./types";
import * as particles from "./particles";

const BAR_COUNT = 80;

// Smoothed bar heights for fluid animation
const smoothBars = new Float32Array(BAR_COUNT);

function getHue(
  energy: { low: number; mid: number; high: number },
  position: number,
): number {
  const intensity = energy.low * 0.5 + energy.mid * 0.3 + energy.high * 0.2;
  // High energy: warm hues (0-50), normal: cool hues (180-280)
  if (intensity > 0.55) {
    return 10 + position * 50; // red → orange → yellow
  }
  return 180 + position * 100; // cyan → blue → purple
}

export const spectrum: VisualizerRenderer = {
  name: "Spectrum",

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AnalyserData | null,
    state: VisualizerState,
  ) {
    // Trailing fade — longer trail for more cinematic feel
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(0, 0, width, height);

    if (!data) {
      particles.updateAndDraw(ctx, state.deltaTime);
      return;
    }

    const { frequency, energy } = data;
    const binCount = frequency.length;
    const binsPerBar = Math.floor(binCount / BAR_COUNT);

    const gap = 3;
    const padding = 20;
    const barWidth = (width - padding * 2 - gap * (BAR_COUNT - 1)) / BAR_COUNT;
    const intensity = energy.low * 0.5 + energy.mid * 0.3 + energy.high * 0.2;

    // Beat detection
    const isBeat = state.beatIntensity > 0.7;

    // Screen flash on hard beats
    if (state.beatIntensity > 0.85) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(state.beatIntensity - 0.85) * 0.15})`;
      ctx.fillRect(0, 0, width, height);
    }

    for (let i = 0; i < BAR_COUNT; i++) {
      let sum = 0;
      for (let j = 0; j < binsPerBar; j++) {
        sum += frequency[i * binsPerBar + j];
      }
      const rawValue = sum / binsPerBar / 255;

      // Smooth interpolation for fluid motion
      smoothBars[i] += (rawValue - smoothBars[i]) * 0.3;
      const value = smoothBars[i];

      const barHeight = value * height * 0.88;
      if (barHeight < 1) continue;

      const x = padding + i * (barWidth + gap);
      const y = height - barHeight;

      const hue = getHue(energy, i / BAR_COUNT);
      const lightness = 45 + intensity * 35;

      // Main bar with gradient
      const gradient = ctx.createLinearGradient(x, y, x, height);
      gradient.addColorStop(0, `hsla(${hue}, 95%, ${lightness + 15}%, 1)`);
      gradient.addColorStop(0.5, `hsla(${hue}, 90%, ${lightness}%, 0.9)`);
      gradient.addColorStop(1, `hsla(${hue}, 85%, ${lightness - 15}%, 0.3)`);

      // Glow
      ctx.save();
      ctx.shadowColor = `hsla(${hue}, 100%, ${lightness}%, 0.8)`;
      ctx.shadowBlur = 10 + intensity * 30;
      ctx.fillStyle = gradient;

      // Rounded top
      const r = Math.min(barWidth / 2, 5);
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + barWidth - r, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
      ctx.lineTo(x + barWidth, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Mirror reflection at bottom (subtle)
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = `hsla(${hue}, 90%, ${lightness}%, 1)`;
      const reflectHeight = barHeight * 0.2;
      ctx.fillRect(x, height, barWidth, reflectHeight);
      ctx.restore();

      // Particles on beats
      if (isBeat && value > 0.45 && Math.random() > 0.5) {
        particles.spawn(x + barWidth / 2, y, hue, 4, 4, 5);
      }
    }

    // Ambient glow at bottom
    const bottomGlow = ctx.createLinearGradient(0, height - 60, 0, height);
    const glowHue = 180 + intensity * 100;
    bottomGlow.addColorStop(0, "transparent");
    bottomGlow.addColorStop(1, `hsla(${glowHue}, 80%, 50%, ${0.05 + intensity * 0.1})`);
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, height - 60, width, 60);

    particles.updateAndDraw(ctx, state.deltaTime);
  },
};
