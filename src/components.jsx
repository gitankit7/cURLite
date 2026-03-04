import React from 'react';
import { METHOD_COLORS } from './curl.js';

export function MethodBadge({ method }) {
  const color = METHOD_COLORS[method] || '#fff';
  return (
    <span
      style={{
        color,
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.05em',
        background: `${color}18`,
        padding: '2px 8px',
        borderRadius: 4,
        border: `1px solid ${color}40`,
      }}
    >
      {method}
    </span>
  );
}

export function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#1e293b' : 'transparent',
        color: active ? '#e2e8f0' : '#64748b',
        border: 'none',
        padding: '8px 16px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        cursor: 'pointer',
        borderBottom: active ? '2px solid #22d3ee' : '2px solid transparent',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}
