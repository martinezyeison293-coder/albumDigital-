import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import './fx.css';

export default function TiltedCard({ children, maxTilt = 10, className = '' }) {
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rX = useSpring(useTransform(py, [-0.5, 0.5], [maxTilt, -maxTilt]), { stiffness: 180, damping: 18 });
  const rY = useSpring(useTransform(px, [-0.5, 0.5], [-maxTilt, maxTilt]), { stiffness: 180, damping: 18 });

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const reset = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      className={`fx-tilted ${className}`}
      style={{ rotateX: rX, rotateY: rY, perspective: 800 }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      {children}
    </motion.div>
  );
}