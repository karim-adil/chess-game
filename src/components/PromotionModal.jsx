import React from 'react';
import ChessPieceSvg from './ChessPieceSvg';

export default function PromotionModal({ color, onSelectPromotion }) {
  const options = [
    { type: 'q', label: 'Queen' },
    { type: 'r', label: 'Rook' },
    { type: 'b', label: 'Bishop' },
    { type: 'n', label: 'Knight' }
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-content promotion-modal glass-card">
        <h3 className="modal-title">Promote Pawn</h3>
        <p className="modal-subtitle">Select piece to promote to:</p>

        <div className="promotion-grid">
          {options.map(({ type, label }) => (
            <button
              key={type}
              className="promotion-option-btn"
              onClick={() => onSelectPromotion(type)}
            >
              <ChessPieceSvg type={type} color={color} size="48px" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
