import React, { useMemo, useRef, useState } from 'react';

const N = 18;
const THRESHOLD = 0.55;
const DISTANCE = 190;

function zigzag() {
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * 100;
    const y = (Math.random() * 0.7 + 0.3) * 100;
    pts.push({ x, y });
  }
  return pts;
}

export default function PackOpener({ src, stickers = [], onTorn, disabled }) {
  const tears = useMemo(zigzag, []);
  const start = useRef(null);
  const [progress, setProgress] = useState(0);
  const [dir, setDir] = useState(1);
  const [torn, setTorn] = useState(false);

  const topPoly = () => {
    const p = tears;
    return [`0,0`, `100,0`, `100,${p[N].y}`, ...[...p].reverse().map(t => `${t.x},${t.y}`)].join(' ');
  };
  const bottomPoly = () => {
    const p = tears;
    return [`0,${p[0].y}`, ...p.map(t => `${t.x},${t.y}`), '100,100', '0,100'].join(' ');
  };

  const handleDown = (e) => {
    if (disabled || torn) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX };
  };

  const handleMove = (e) => {
    if (!start.current || disabled || torn) return;
    const dx = e.clientX - start.current.x;
    setDir(dx >= 0 ? 1 : -1);
    setProgress(Math.min(1, Math.abs(dx) / DISTANCE));
  };

  const handleUp = () => {
    if (!start.current) return;
    start.current = null;
    if (progress >= THRESHOLD) {
      setProgress(1);
      setTorn(true);
      if (onTorn) setTimeout(onTorn, 700);
    } else {
      setProgress(0);
    }
  };

  const flapLift = progress * 48;
  const flapRot = dir * progress * 15;
  const flapTx = dir * progress * 28;

  const visibleCount = torn ? stickers.length : Math.max(0, Math.floor(progress * (stickers.length || 5)));
  const peekItems = () => {
    if (stickers.length) return stickers.slice(0, Math.max(1, visibleCount));
    return Array.from({ length: Math.max(1, visibleCount) }, () => null);
  };

  return (
    <div
      className={`pack-opener${torn ? ' torn' : ''}${disabled ? ' disabled' : ''}`}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <div className="opener-stickers" style={{ clipPath: `inset(0 0 ${100 - progress * 62}% 0)` }}>
        {peekItems().map((s, i) => (
          <div key={i} className="opener-sticker" style={{ '--i': i, backgroundImage: s ? `url(${s})` : undefined }}>
            {!s && <span className="opener-sticker-back" />}
          </div>
        ))}
      </div>

      <div className="opener-envelope below" style={{ clipPath: `polygon(${bottomPoly()})` }}>
        <img src={src} alt="Sobre" className="opener-img" draggable={false} />
      </div>

      <div
        className="opener-flap"
        style={{
          clipPath: `polygon(${topPoly()})`,
          transform: `translate3d(${flapTx}px, ${-flapLift}px, 0) rotate(${flapRot}deg)`
        }}
      >
        <img src={src} alt="" className="opener-img" draggable={false} />
      </div>

      <div className="opener-glow" style={{ opacity: progress }} />

      {!torn && (
        <div className="tear-hint opener-hint" style={{ opacity: progress > 0.02 ? 1 - progress : 1 }}>
          {progress > 0.02 ? 'Rasgando…' : 'Toma la punta del sobre y arrastra hacia un lado'}
        </div>
      )}
      {torn && (
        <div className="opener-done">¡Sobre abierto!</div>
      )}
    </div>
  );
}
