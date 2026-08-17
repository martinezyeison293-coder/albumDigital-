import React, { useRef } from 'react';
import './fx.css';

export default function ClickSpark({
  children,
  className = '',
  sparkColor = '#ffd700',
  spawnCount = 12,
  sparkRadius = 48,
  duration = 500
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const alive = [];
    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.life -= 1 / duration * 16;
      if (p.life <= 0) continue;
      alive.push(p);
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = sparkColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    particlesRef.current = alive;

    if (alive.length > 0) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(rafRef.current);
    }
  };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    for (let i = 0; i < spawnCount; i++) {
      const angle = (i / spawnCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 0.6 + Math.random() * 1.4;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * sparkRadius * speed,
        vy: Math.sin(angle) * sparkRadius * speed,
        size: 2.2 + Math.random() * 2.5,
        life: 1
      });
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  return (
    <div ref={wrapRef} className={`fx-clickspark-wrap ${className}`} onClick={handleClick}>
      {children}
      <canvas ref={canvasRef} className="fx-clickspark" />
    </div>
  );
}