import React from 'react';
import ChessPieceSvg from './ChessPieceSvg';

export default function Square({
  row,
  col,
  piece,
  isDark,
  isSelected,
  isLastMove,
  isLegalMove,
  isCaptureTarget,
  isInCheck,
  isHintMove,
  onSquareClick,
  onDragStart,
  onDragOver,
  onDrop,
  showCoords,
  boardFlipped
}) {
  // Coordinates labels
  const fileChar = String.fromCharCode(97 + col);
  const rankNum = 8 - row;

  // Render coordinate tags at corners
  const showRankLabel = showCoords && (boardFlipped ? col === 7 : col === 0);
  const showFileLabel = showCoords && (boardFlipped ? row === 0 : row === 7);

  let squareClasses = `square ${isDark ? 'dark-square' : 'light-square'}`;
  if (isSelected) squareClasses += ' selected';
  if (isLastMove) squareClasses += ' last-move';
  if (isInCheck) squareClasses += ' king-in-check';
  if (isHintMove) squareClasses += ' hint-square';

  return (
    <div
      className={squareClasses}
      onClick={() => onSquareClick(row, col)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(row, col);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(row, col);
      }}
    >
      {/* Rank label (1-8) */}
      {showRankLabel && (
        <span className={`coord rank-coord ${isDark ? 'dark-coord' : 'light-coord'}`}>
          {rankNum}
        </span>
      )}

      {/* File label (a-h) */}
      {showFileLabel && (
        <span className={`coord file-coord ${isDark ? 'dark-coord' : 'light-coord'}`}>
          {fileChar}
        </span>
      )}

      {/* Legal Move Indicators */}
      {isLegalMove && !isCaptureTarget && <div className="legal-dot" />}
      {isLegalMove && isCaptureTarget && <div className="capture-ring" />}

      {/* Piece SVG */}
      {piece && (
        <div
          className="piece-container"
          draggable
          onDragStart={(e) => onDragStart(e, row, col)}
        >
          <ChessPieceSvg type={piece.type} color={piece.color} />
        </div>
      )}
    </div>
  );
}
