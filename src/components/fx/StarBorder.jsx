import React from 'react';
import './fx.css';

export default function StarBorder({ children, className = '' }) {
  return <div className={`fx-star-border ${className}`}>{children}</div>;
}