import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Eye } from 'lucide-react';
import { soundFx } from '../logic/soundEngine';

export default function GameOverModal({ gameEnd, onNewGame, onCloseModal }) {
  const { result, winner } = gameEnd;

  useEffect(() => {
    if (winner) {
      soundFx.playWin();
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // fallback if canvas canvas-confetti not loaded
      }
    } else {
      soundFx.playLose();
    }
  }, [winner]);

  const getTitle = () => {
    if (winner === 'w') return 'White Wins!';
    if (winner === 'b') return 'Black Wins!';
    return 'Game Draw!';
  };

  const getSubtitle = () => {
    switch (result) {
      case 'checkmate':
        return 'by Checkmate';
      case 'stalemate':
        return 'by Stalemate';
      case '50-move':
        return 'by 50-move rule';
      case 'insufficient':
        return 'by Insufficient Material';
      case 'timeout':
        return `by Timeout (${winner === 'w' ? 'Black ran out of time' : 'White ran out of time'})`;
      case 'resignation':
        return `by Resignation (${winner === 'w' ? 'Black resigned' : 'White resigned'})`;
      default:
        return '';
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content game-over-modal glass-card">
        <div className="trophy-icon-wrapper">
          <Trophy size={48} className="trophy-icon" />
        </div>
        <h2 className="modal-title">{getTitle()}</h2>
        <p className="modal-subtitle">{getSubtitle()}</p>

        <div className="modal-action-buttons">
          <button className="primary-btn" onClick={onNewGame}>
            <RefreshCw size={18} /> New Game
          </button>
          <button className="secondary-btn" onClick={onCloseModal}>
            <Eye size={18} /> Review Board
          </button>
        </div>
      </div>
    </div>
  );
}
