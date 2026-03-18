export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  size: number;
}

const pool: Particle[] = [];
const MAX_PARTICLES = 500;

export function spawn(
  x: number,
  y: number,
  hue: number,
  count: number,
  spread: number = 3,
  speed: number = 4,
) {
  for (let i = 0; i < count && pool.length < MAX_PARTICLES; i++) {
    pool.push({
      x,
      y,
      vx: (Math.random() - 0.5) * spread,
      vy: -Math.random() * speed - 1,
      life: 1,
      maxLife: 0.4 + Math.random() * 0.6,
      hue,
      size: 1 + Math.random() * 3,
    });
  }
}

export function updateAndDraw(
  ctx: CanvasRenderingContext2D,
  dt: number,
) {
  for (let i = pool.length - 1; i >= 0; i--) {
    const p = pool[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    p.life -= dt / p.maxLife;

    if (p.life <= 0) {
      pool.splice(i, 1);
      continue;
    }

    const alpha = p.life * p.life; // quadratic falloff
    const size = p.size * p.life;
    const color = `hsla(${p.hue}, 100%, 70%, ${alpha})`;

    ctx.save();
    ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${alpha * 0.8})`;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
