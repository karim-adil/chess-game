import React from 'react';

export default function EvalBar({ score, boardFlipped }) {
  // score in centipawns (positive = White, negative = Black)
  // Convert score to percentage (capped between -1000 and +1000)
  const cappedScore = Math.max(-1000, Math.min(1000, score));
  
  // Calculate percentage of White advantage (0% to 100%)
  const whitePercent = 50 + (cappedScore / 20); // 1000 score = 100% white, -1000 score = 0% white
  const clampedWhitePercent = Math.max(5, Math.min(95, whitePercent));
  
  const displayScore = (score / 100).toFixed(1);
  const formattedScore = score > 0 ? `+${displayScore}` : displayScore;

  return (
    <div className="eval-bar-container">
      <div
        className="eval-bar-fill"
        style={{
          height: boardFlipped ? `${100 - clampedWhitePercent}%` : `${clampedWhitePercent}%`,
          transition: 'height 0.4s ease-in-out'
        }}
      />
      <div className="eval-bar-label">
        {score === 0 ? '0.0' : formattedScore}
      </div>
    </div>
  );
}
