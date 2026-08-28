import React, { useEffect, useRef } from 'react';

const RARITY_COLORS = {
  common: ['#9CA3AF'],
  rare: ['#3B82F6', '#60A5FA', '#93C5FD'],
  epic: ['#8B5CF6', '#A855F7', '#C084FC', '#E879F9'],
  legendary: ['#FFD700', '#F59E0B', '#FDE047', '#FFF7CC', '#FFEAA7']
};

export default function PixelBlast({ active, rarity = 'epic', size = 26, className = '' }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const colors = RARITY_COLORS[rarity] || RARITY_COLORS.epic;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const explorer = 0.4 + Math.random() * 0.4;

    for (let i = 0; i < size * 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        gravity: 0.12 + Math.random() * 0.12
      });
      if (Math.random() < explorer) {
        particlesRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed * 1.8,
          vy: Math.sin(angle) * speed * 1.8,
          size: 1.5 + Math.random() * 2.5,
          color: '#FFFFFF',
          life: 1,
          decay: 0.012 + Math.random() * 0.015,
          gravity: 0.05
        });
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      const alive = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life -= p.decay;
        if (p.life <= 0 || p.y > canvas.height || p.x < -50 || p.x > canvas.width + 50) continue;
        alive.push(p);
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalCompositeOperation = 'source-over';
      particlesRef.current = alive;
      if (alive.length > 0) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [active, rarity, size]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  if (!active) return null;
  return <canvas ref={canvasRef} className={`fx-pixelblast ${className}`} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 110 }} />;
}
