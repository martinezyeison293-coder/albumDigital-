import React from 'react';
import './fx.css';

export default function ShinyText({ children, className = '' }) {
  return <span className={`fx-shiny ${className}`}>{children}</span>;
}