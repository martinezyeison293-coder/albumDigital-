import React, { useRef, useState } from 'react';

const SEED = [-1, 1, -0.6, 1.2, -0.8, 0.9, -1.3, 0.7, -0.9, 1.1, -0.6, 1.3, -1];
const N = 12;
const TEAR_Y = 0.26;
const AMP = 1.4;
const DISTANCE = 170;
const THRESHOLD = 0.6;

function tornPolygons() {
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * 100;
    const y = TEAR_Y * 100 + SEED[i % SEED.length] * AMP;
    pts.push({ x, y });
  }
  const top = [
    '0,0',
    '100,0',
    `100,${pts[N].y}`,
    ...[...pts].reverse().map(p => `${p.x},${p.y}`)
  ].join(' ');
  const bottom = [
    `0,${pts[0].y}`,
    ...pts.map(p => `${p.x},${p.y}`),
    '100,100',
    '0,100'
  ].join(' ');
  return { top, bottom };
}

export default function PackTear({ src, onOpen, disabled }) {
  const polygons = useRef(tornPolygons()).current;
  const start = useRef(null);
  const [progress, setProgress] = useState(0);
  const [dir, setDir] = useState(1);

  const handleDown = (e) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX };
  };

  const handleMove = (e) => {
    if (!start.current || disabled) return;
    const dx = e.clientX - start.current.x;
    setDir(dx >= 0 ? 1 : -1);
    setProgress(Math.min(1, Math.abs(dx) / DISTANCE));
  };

  const handleUp = () => {
    if (!start.current) return;
    start.current = null;
    if (progress >= THRESHOLD && onOpen) onOpen();
    setProgress(0);
  };

  const lift = progress * TEAR_Y * 50;
  const tx = dir * progress * 130;
  const rot = dir * progress * 18;

  return (
    <div
      className={`pack-tear${disabled ? ' disabled' : ''}`}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <img src={src} alt="Sobre" className="pack-tear-img" draggable={false} />

      <div className="tear-glow" style={{ opacity: progress }} />

      <div
        className="tear-piece tear-bottom"
        style={{ clipPath: `polygon(${polygons.bottom})` }}
      >
        <img src={src} alt="" className="pack-tear-img" draggable={false} />
      </div>

      <div
        className="tear-piece tear-top"
        style={{
          clipPath: `polygon(${polygons.top})`,
          transform: `translate3d(${tx}px, ${-lift}px, 0) rotate(${rot}deg)`
        }}
      >
        <img src={src} alt="" className="pack-tear-img" draggable={false} />
      </div>

      {progress > 0.02 && progress < 1 && (
        <div className="tear-hint" style={{ opacity: 1 - progress }}>
          Rasgando...
        </div>
      )}
    </div>
  );
}