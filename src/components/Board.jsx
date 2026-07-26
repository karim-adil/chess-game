import React, { useState } from 'react';
import Square from './Square';
import { findKing, isKingInCheck } from '../logic/chessEngine';

export default function Board({
  gameState,
  legalMoves,
  selectedSquare,
  lastMove,
  hintMove,
  boardFlipped,
  showCoords = true,
  onSelectSquare,
  onExecuteMove
}) {
  const [draggedFrom, setDraggedFrom] = useState(null);

  const { board, turn } = gameState;

  // Find king position if in check
  const kingInCheckPos = isKingInCheck(board, turn) ? findKing(board, turn) : null;

  // Compute legal destination squares for currently selected square
  const legalTargets = selectedSquare
    ? legalMoves.filter(m => m.fromRow === selectedSquare.row && m.fromCol === selectedSquare.col)
    : [];

  const handleSquareClick = (row, col) => {
    onSelectSquare(row, col);
  };

  const handleDragStart = (e, row, col) => {
    setDraggedFrom({ row, col });
    onSelectSquare(row, col);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (row, col) => {
    // allow drop
  };

  const handleDrop = (toRow, toCol) => {
    if (draggedFrom) {
      const move = legalMoves.find(
        m => m.fromRow === draggedFrom.row &&
             m.fromCol === draggedFrom.col &&
             m.toRow === toRow &&
             m.toCol === toCol
      );
      if (move) {
        onExecuteMove(move);
      }
      setDraggedFrom(null);
    }
  };

  // Build grid layout based on orientation
  const rowIndices = boardFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const colIndices = boardFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="chessboard-container">
      <div className="chessboard-grid">
        {rowIndices.map(r =>
          colIndices.map(c => {
            const piece = board[r][c];
            const isDark = (r + c) % 2 === 1;

            const isSelected = selectedSquare?.row === r && selectedSquare?.col === c;
            const isLastMove = lastMove && ((lastMove.fromRow === r && lastMove.fromCol === c) || (lastMove.toRow === r && lastMove.toCol === c));
            const isHint = hintMove && ((hintMove.fromRow === r && hintMove.fromCol === c) || (hintMove.toRow === r && hintMove.toCol === c));

            const targetMove = legalTargets.find(m => m.toRow === r && m.toCol === c);
            const isLegalMove = Boolean(targetMove);
            const isCaptureTarget = isLegalMove && Boolean(piece || targetMove?.isEnPassant);

            const isInCheck = kingInCheckPos?.row === r && kingInCheckPos?.col === c;

            return (
              <Square
                key={`${r}-${c}`}
                row={r}
                col={c}
                piece={piece}
                isDark={isDark}
                isSelected={isSelected}
                isLastMove={isLastMove}
                isLegalMove={isLegalMove}
                isCaptureTarget={isCaptureTarget}
                isInCheck={isInCheck}
                isHintMove={isHint}
                onSquareClick={handleSquareClick}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                showCoords={showCoords}
                boardFlipped={boardFlipped}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
