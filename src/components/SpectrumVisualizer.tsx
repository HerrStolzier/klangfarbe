"use client";

import { useEffect, useRef } from "react";
import type { AnalyserData } from "@/hooks/useAnalyser";

interface SpectrumVisualizerProps {
  getData: () => AnalyserData | null;
  isPlaying: boolean;
}

// Number of bars to display
const BAR_COUNT = 64;

// Color transitions based on energy
function getBarColor(
  energy: { low: number; mid: number; high: number },
  barIndex: number,
  totalBars: number,
): string {
  const position = barIndex / totalBars;
  const intensity = energy.low * 0.5 + energy.mid * 0.3 + energy.high * 0.2;

  // Cool (cyan/purple) when calm → warm (orange/white) on drops
  if (intensity > 0.6) {
    // High energy: warm colors
    const hue = 20 + position * 40; // orange to yellow
    const lightness = 50 + intensity * 30;
    return `hsl(${hue}, 100%, ${lightness}%)`;
  }
  // Normal: cyan to purple gradient across bars
  const hue = 180 + position * 100; // cyan → purple
  const lightness = 40 + intensity * 30;
  return `hsl(${hue}, 90%, ${lightness}%)`;
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  glowIntensity: number,
) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 15 + glowIntensity * 25;
  ctx.fillStyle = color;

  // Rounded top bar
  const radius = Math.min(width / 2, 4);
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Particle system for beat hits
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const particles: Particle[] = [];
let prevEnergy = 0;

function spawnParticles(x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 4 - 1,
      life: 1,
      maxLife: 0.5 + Math.random() * 0.5,
      color,
      size: 1.5 + Math.random() * 2,
    });
  }
}

function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  deltaTime: number,
) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // gravity
    p.life -= deltaTime / p.maxLife;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function SpectrumVisualizer({
  getData,
  isPlaying,
}: SpectrumVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx!.scale(dpr, dpr);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function render(timestamp: number) {
      const deltaTime =
        lastTimeRef.current > 0
          ? (timestamp - lastTimeRef.current) / 1000
          : 0.016;
      lastTimeRef.current = timestamp;

      const rect = canvas!.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear with slight trail for smooth decay
      ctx!.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx!.fillRect(0, 0, width, height);

      const data = getData();

      if (data) {
        const { frequency, energy } = data;
        const binCount = frequency.length;
        const binsPerBar = Math.floor(binCount / BAR_COUNT);

        const gap = 2;
        const totalGap = gap * (BAR_COUNT - 1);
        const barWidth = (width - totalGap - 40) / BAR_COUNT; // 40px padding
        const padding = 20;

        // Beat detection: energy spike
        const currentEnergy = energy.low;
        const isBeat = currentEnergy - prevEnergy > 0.15;
        prevEnergy = currentEnergy;

        for (let i = 0; i < BAR_COUNT; i++) {
          // Average frequency bins for this bar
          let sum = 0;
          for (let j = 0; j < binsPerBar; j++) {
            sum += frequency[i * binsPerBar + j];
          }
          const value = sum / binsPerBar / 255;

          const barHeight = value * height * 0.85;
          const x = padding + i * (barWidth + gap);
          const y = height - barHeight;

          const color = getBarColor(energy, i, BAR_COUNT);
          const glowIntensity = energy.low * 0.6 + energy.mid * 0.4;

          drawGlow(ctx!, x, y, barWidth, barHeight, color, glowIntensity);

          // Spawn particles on beat hits (only for active bars)
          if (isBeat && value > 0.5 && Math.random() > 0.6) {
            spawnParticles(x + barWidth / 2, y, color, 3);
          }
        }
      }

      // Always update particles (even when paused, let them fade)
      updateAndDrawParticles(ctx!, deltaTime);

      animationRef.current = requestAnimationFrame(render);
    }

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [getData, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ background: "black" }}
    />
  );
}
