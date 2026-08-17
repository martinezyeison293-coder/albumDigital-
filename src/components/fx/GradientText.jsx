import React from 'react';
import './fx.css';

export default function GradientText({ children, className = '' }) {
  return <span className={`fx-gradient-text ${className}`}>{children}</span>;
}