import React from 'react';
import ChessPieceSvg from './ChessPieceSvg';
import { getMaterialDifference } from '../logic/chessEngine';

export default function CapturedPieces({ capturedPieces, color }) {
  const pieces = capturedPieces[color] || [];
  const diff = getMaterialDifference(capturedPieces);
  
  // Show differential relative to player color
  const pointDiff = color === 'w' ? diff : -diff;

  // Order pieces by value
  const order = ['q', 'r', 'b', 'n', 'p'];
  const sortedPieces = [...pieces].sort((a, b) => order.indexOf(a) - order.indexOf(b));

  return (
    <div className="captured-pieces-bar">
      <div className="captured-list">
        {sortedPieces.map((type, idx) => (
          <div key={idx} className="captured-piece-icon">
            <ChessPieceSvg type={type} color={color === 'w' ? 'b' : 'w'} size="20px" />
          </div>
        ))}
      </div>
      {pointDiff > 0 && (
        <span className="material-advantage">+{pointDiff}</span>
      )}
    </div>
  );
}
