import React, { useEffect, useRef } from 'react';

const COLORS = ['#FFD700', '#6C63FF', '#A855F7', '#10B981', '#F472B6', '#60A5FA', '#F59E0B', '#FFFFFF'];

export default function Confetti({ active, count = 120, className = '' }) {
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

    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: rect.width / 2 + (Math.random() - 0.5) * 80,
        y: rect.height / 3 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 9,
        vy: -Math.random() * 7 - 2,
        gravity: 0.22 + Math.random() * 0.15,
        size: 5 + Math.random() * 7,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
        decay: 0.004 + Math.random() * 0.006
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alive = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.life -= p.decay;
        if (p.life <= 0 || p.y > canvas.height) continue;
        alive.push(p);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      particlesRef.current = alive;
      if (alive.length > 0) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [active, count]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  if (!active) return null;
  return <canvas ref={canvasRef} className={`fx-confetti ${className}`} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }} />;
}