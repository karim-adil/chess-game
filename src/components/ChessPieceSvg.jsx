import React from 'react';

// High quality vector SVG chess pieces with theme styling
export default function ChessPieceSvg({ type, color, size = '100%', className = '' }) {
  const isWhite = color === 'w';

  // Gradient IDs for rich aesthetic styling
  const fillGradientId = isWhite ? 'whitePieceGradient' : 'blackPieceGradient';
  const strokeColor = isWhite ? '#334155' : '#f8fafc';

  const pieceSVGs = {
    p: (
      <path
        d="M 22,38 C 22,34 24,31 27,29 C 25,27 24,24 24,21 C 24,17.7 26.7,15 30,15 C 33.3,15 36,17.7 36,21 C 36,24 35,27 33,29 C 36,31 38,34 38,38 Z M 16,42 L 44,42 L 42,40 L 18,40 Z M 14,45 L 46,45 L 46,43 L 14,43 Z"
        fill={`url(#${fillGradientId})`}
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
    r: (
      <path
        d="M 12,42 L 48,42 L 48,39 L 44,36 L 44,22 L 48,19 L 48,12 L 41,12 L 41,16 L 35,16 L 35,12 L 29,12 L 29,16 L 23,16 L 23,12 L 16,12 L 16,19 L 20,22 L 20,36 L 16,39 Z M 10,45 L 50,45 L 50,43 L 10,43 Z"
        fill={`url(#${fillGradientId})`}
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
    n: (
      <path
        d="M 22,10 C 22,10 28,11 31,16 C 33,19 32,23 29,24 C 27,25 24,22 24,22 C 24,22 27,27 31,28 C 36,29 41,27 43,21 C 45,15 41,10 37,8 C 31,5 24,6 20,10 C 17,13 15,18 15,24 C 15,31 19,38 21,41 L 44,41 L 42,38 L 26,38 C 24,36 22,31 22,26 Z M 12,45 L 48,45 L 48,43 L 12,43 Z"
        fill={`url(#${fillGradientId})`}
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
    b: (
      <path
        d="M 30,9 C 27.5,9 25.5,11 25.5,13.5 C 25.5,15 26.5,16.2 27.8,17 C 23.5,20.5 22,26.5 24,31.5 C 25.5,35 28.5,37 30,37.5 C 31.5,37 34.5,35 36,31.5 C 38,26.5 36.5,20.5 32.2,17 C 33.5,16.2 34.5,15 34.5,13.5 C 34.5,11 32.5,9 30,9 Z M 20,40 L 40,40 L 40,38 L 20,38 Z M 16,43 L 44,43 L 44,41 L 16,41 Z M 14,46 L 46,46 L 46,44 L 14,44 Z"
        fill={`url(#${fillGradientId})`}
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
    q: (
      <path
        d="M 10,21 C 10,22.7 11.3,24 13,24 C 14.7,24 16,22.7 16,21 C 16,19.3 14.7,18 13,18 C 11.3,18 10,19.3 10,21 Z M 21,15 C 21,16.7 22.3,18 24,18 C 25.7,18 27,16.7 27,15 C 27,13.3 25.7,12 24,12 C 22.3,12 21,13.3 21,15 Z M 33,15 C 33,16.7 34.3,18 36,18 C 37.7,18 39,16.7 39,15 C 39,13.3 37.7,12 36,12 C 34.3,12 33,13.3 33,15 Z M 44,21 C 44,22.7 45.3,24 47,24 C 48.7,24 50,22.7 50,21 C 50,19.3 48.7,18 47,18 C 45.3,18 44,19.3 44,21 Z M 13,26 L 18,37 L 42,37 L 47,26 L 39,30 L 36,20 L 30,32 L 24,20 L 21,30 Z M 18,41 L 42,41 L 42,39 L 18,39 Z M 14,45 L 46,45 L 46,43 L 14,43 Z"
        fill={`url(#${fillGradientId})`}
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
    k: (
      <g>
        {/* Classic Staunton King Crown Top Orb (Replacing Cross) */}
        <circle
          cx="30"
          cy="9"
          r="3.2"
          fill={`url(#${fillGradientId})`}
          stroke={strokeColor}
          strokeWidth="1.8"
        />
        {/* Authentic Staunton King Body & Crown */}
        <path
          d="M 27,12 L 33,12 L 33,16 C 37,18 41,22 41,30 C 41,34 39,37 36,39 L 24,39 C 21,37 19,34 19,30 C 19,22 23,18 27,16 Z M 18,42 L 42,42 L 42,40 L 18,40 Z M 14,45 L 46,45 L 46,43 L 14,43 Z"
          fill={`url(#${fillGradientId})`}
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Crown Arch Band (Distinct King Feature) */}
        <path
          d="M 24,25 Q 30,22 36,25"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
        />
      </g>
    )
  };

  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      className={`chess-piece-svg ${isWhite ? 'white-piece' : 'black-piece'} ${className}`}
      style={{ filter: isWhite ? 'drop-shadow(0px 3px 6px rgba(0,0,0,0.4))' : 'drop-shadow(0px 3px 6px rgba(0,0,0,0.8))' }}
    >
      <defs>
        {/* White Piece Metallic/Pearl Gradient */}
        <linearGradient id="whitePieceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Black Piece Obsidian Gradient */}
        <linearGradient id="blackPieceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      {pieceSVGs[type]}
    </svg>
  );
}
