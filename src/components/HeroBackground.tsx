"use client";

import { useEffect, useRef } from "react";

const BAR_COUNT = 48;
const smooth = new Float32Array(BAR_COUNT);

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    function render(t: number) {
      const rect = canvas!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx!.fillStyle = "#000";
      ctx!.fillRect(0, 0, w, h);

      const centerY = h * 0.55;
      const gap = 4;
      const padding = 40;
      const barW = (w - padding * 2 - gap * (BAR_COUNT - 1)) / BAR_COUNT;

      for (let i = 0; i < BAR_COUNT; i++) {
        // Generate fake frequency data using layered sine waves
        const pos = i / BAR_COUNT;
        const raw =
          Math.sin(pos * 4 + t * 0.0008) * 0.3 +
          Math.sin(pos * 7 - t * 0.0012) * 0.2 +
          Math.sin(pos * 13 + t * 0.002) * 0.15 +
          Math.cos(pos * 2 + t * 0.0005) * 0.2 +
          0.35;

        const value = Math.max(0, Math.min(1, raw));
        smooth[i] += (value - smooth[i]) * 0.08;

        const barH = smooth[i] * h * 0.4;
        const x = padding + i * (barW + gap);
        const y = centerY - barH / 2;

        // Gradient: cyan center → purple edges
        const hue = 180 + pos * 100;
        const lightness = 30 + smooth[i] * 30;
        const alpha = 0.4 + smooth[i] * 0.4;

        ctx!.save();
        ctx!.shadowColor = `hsla(${hue}, 90%, ${lightness + 20}%, 0.5)`;
        ctx!.shadowBlur = 12;
        ctx!.fillStyle = `hsla(${hue}, 85%, ${lightness}%, ${alpha})`;

        const r = Math.min(barW / 2, 3);
        ctx!.beginPath();
        ctx!.moveTo(x, y + barH);
        ctx!.lineTo(x, y + r);
        ctx!.quadraticCurveTo(x, y, x + r, y);
        ctx!.lineTo(x + barW - r, y);
        ctx!.quadraticCurveTo(x + barW, y, x + barW, y + r);
        ctx!.lineTo(x + barW, y + barH);
        ctx!.closePath();
        ctx!.fill();
        ctx!.restore();

        // Reflection
        ctx!.save();
        ctx!.globalAlpha = 0.08;
        ctx!.fillStyle = `hsla(${hue}, 85%, ${lightness}%, 1)`;
        ctx!.fillRect(x, centerY + barH / 2, barW, barH * 0.15);
        ctx!.restore();
      }

      // Ambient glow
      const grad = ctx!.createRadialGradient(w / 2, centerY, 0, w / 2, centerY, w * 0.5);
      grad.addColorStop(0, "rgba(0, 200, 255, 0.03)");
      grad.addColorStop(1, "transparent");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full opacity-60"
      aria-hidden
    />
  );
}
