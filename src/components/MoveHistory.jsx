import React, { useEffect, useRef } from 'react';
import { SkipBack, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

export default function MoveHistory({
  moveHistory,
  currentMoveIndex,
  onJumpToMove
}) {
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new moves are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [moveHistory.length]);

  const movesCount = moveHistory.length;

  return (
    <div className="move-history-card">
      <div className="card-header">
        <h3 className="card-title">Move Notation</h3>
        <span className="move-badge">{movesCount} moves</span>
      </div>

      <div className="move-list-container" ref={containerRef}>
        {movesCount === 0 ? (
          <div className="empty-history">Game started. Make a move!</div>
        ) : (
          <table className="move-history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>White</th>
                <th>Black</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(movesCount / 2) }).map((_, i) => {
                const whiteIndex = i * 2;
                const blackIndex = i * 2 + 1;
                const whiteMove = moveHistory[whiteIndex];
                const blackMove = moveHistory[blackIndex];

                const isWhiteActive = currentMoveIndex === whiteIndex;
                const isBlackActive = currentMoveIndex === blackIndex;

                return (
                  <tr key={i}>
                    <td className="move-num">{i + 1}.</td>
                    <td
                      className={`move-san ${isWhiteActive ? 'active-move' : ''}`}
                      onClick={() => onJumpToMove(whiteIndex)}
                    >
                      {whiteMove?.san || ''}
                    </td>
                    <td
                      className={`move-san ${isBlackActive ? 'active-move' : ''}`}
                      onClick={() => blackMove && onJumpToMove(blackIndex)}
                    >
                      {blackMove?.san || ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="history-controls">
        <button
          className="icon-btn"
          disabled={currentMoveIndex < 0}
          onClick={() => onJumpToMove(-1)}
          title="Start of game"
        >
          <SkipBack size={18} />
        </button>
        <button
          className="icon-btn"
          disabled={currentMoveIndex < 0}
          onClick={() => onJumpToMove(currentMoveIndex - 1)}
          title="Previous move"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          className="icon-btn"
          disabled={currentMoveIndex >= movesCount - 1}
          onClick={() => onJumpToMove(currentMoveIndex + 1)}
          title="Next move"
        >
          <ChevronRight size={18} />
        </button>
        <button
          className="icon-btn"
          disabled={currentMoveIndex >= movesCount - 1}
          onClick={() => onJumpToMove(movesCount - 1)}
          title="Latest move"
        >
          <SkipForward size={18} />
        </button>
      </div>
    </div>
  );
}
