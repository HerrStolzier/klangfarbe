import type { VisualizerRenderer, AnalyserData, VisualizerState } from "./types";
import * as particles from "./particles";

const SEGMENT_COUNT = 120;
const smoothSegments = new Float32Array(SEGMENT_COUNT);

// Rotating angle offset for organic movement
let rotation = 0;

export const radial: VisualizerRenderer = {
  name: "Radial",

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AnalyserData | null,
    state: VisualizerState,
  ) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, width, height);

    if (!data) {
      particles.updateAndDraw(ctx, state.deltaTime);
      return;
    }

    const { frequency, energy } = data;
    const intensity = energy.low * 0.5 + energy.mid * 0.3 + energy.high * 0.2;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.18;
    const maxRadius = Math.min(width, height) * 0.42;

    // Slowly rotate
    rotation += state.deltaTime * (0.1 + intensity * 0.3);

    // Beat flash
    if (state.beatIntensity > 0.85) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(state.beatIntensity - 0.85) * 0.1})`;
      ctx.fillRect(0, 0, width, height);
    }

    const binCount = frequency.length;
    const binsPerSegment = Math.floor(binCount / SEGMENT_COUNT);

    // Inner glow circle
    ctx.save();
    const innerGlow = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, baseRadius * (1 + intensity * 0.5),
    );
    const glowHue = intensity > 0.5 ? 280 : 200;
    innerGlow.addColorStop(0, `hsla(${glowHue}, 80%, 60%, ${0.1 + intensity * 0.15})`);
    innerGlow.addColorStop(1, "transparent");
    ctx.fillStyle = innerGlow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Draw mirrored spectrum as radial bars
    for (let layer = 0; layer < 2; layer++) {
      const layerAlpha = layer === 0 ? 1 : 0.3;
      const layerScale = layer === 0 ? 1 : 0.5;
      const layerRotation = layer === 0 ? rotation : -rotation * 0.7;

      ctx.save();
      ctx.globalAlpha = layerAlpha;

      for (let i = 0; i < SEGMENT_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < binsPerSegment; j++) {
          sum += frequency[i * binsPerSegment + j];
        }
        const rawValue = sum / binsPerSegment / 255;

        // Smooth
        smoothSegments[i] += (rawValue - smoothSegments[i]) * 0.25;
        const value = smoothSegments[i];

        const angle = (i / SEGMENT_COUNT) * Math.PI * 2 + layerRotation;
        const barLength = value * (maxRadius - baseRadius) * layerScale;

        if (barLength < 1) continue;

        const innerR = baseRadius;
        const outerR = baseRadius + barLength;

        const x1 = centerX + Math.cos(angle) * innerR;
        const y1 = centerY + Math.sin(angle) * innerR;
        const x2 = centerX + Math.cos(angle) * outerR;
        const y2 = centerY + Math.sin(angle) * outerR;

        // Color: position around circle + energy
        const hue = (i / SEGMENT_COUNT) * 360 + (intensity > 0.5 ? 30 : 0);
        const lightness = 45 + intensity * 30;

        ctx.strokeStyle = `hsla(${hue}, 90%, ${lightness}%, ${0.6 + value * 0.4})`;
        ctx.shadowColor = `hsla(${hue}, 100%, ${lightness}%, 0.6)`;
        ctx.shadowBlur = 8 + intensity * 15;
        ctx.lineWidth = Math.max(1.5, (Math.PI * 2 * innerR) / SEGMENT_COUNT * 0.7);
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Particles at tips on beat
        if (
          layer === 0 &&
          state.beatIntensity > 0.7 &&
          value > 0.5 &&
          Math.random() > 0.85
        ) {
          particles.spawn(x2, y2, hue, 2, 3, 3);
        }
      }

      ctx.restore();
    }

    // Center dot
    ctx.save();
    const dotHue = intensity > 0.5 ? 320 : 200;
    ctx.fillStyle = `hsla(${dotHue}, 90%, 70%, ${0.5 + intensity * 0.5})`;
    ctx.shadowColor = `hsla(${dotHue}, 100%, 60%, 0.8)`;
    ctx.shadowBlur = 20 + intensity * 30;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4 + intensity * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    particles.updateAndDraw(ctx, state.deltaTime);
  },
};
