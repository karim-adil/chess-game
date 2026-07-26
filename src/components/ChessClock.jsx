import React, { useEffect } from 'react';

export default function ChessClock({
  whiteTime,
  blackTime,
  activeTurn,
  isTimerRunning,
  onTimeOut,
  timeControl
}) {
  useEffect(() => {
    if (!isTimerRunning || timeControl === 'unlimited') return;

    const timer = setInterval(() => {
      if (activeTurn === 'w') {
        if (whiteTime <= 1) {
          onTimeOut('w');
        }
      } else {
        if (blackTime <= 1) {
          onTimeOut('b');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, activeTurn, whiteTime, blackTime, timeControl, onTimeOut]);

  const formatTime = (seconds) => {
    if (timeControl === 'unlimited') return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWhiteActive = activeTurn === 'w' && isTimerRunning && timeControl !== 'unlimited';
  const isBlackActive = activeTurn === 'b' && isTimerRunning && timeControl !== 'unlimited';

  const isWhiteLow = whiteTime <= 20 && timeControl !== 'unlimited';
  const isBlackLow = blackTime <= 20 && timeControl !== 'unlimited';

  return (
    <div className="chess-clock-box">
      <div className={`clock-card white-clock ${isWhiteActive ? 'clock-active' : ''} ${isWhiteLow ? 'clock-low' : ''}`}>
        <span className="clock-player">White</span>
        <span className="clock-time">{formatTime(whiteTime)}</span>
      </div>

      <div className={`clock-card black-clock ${isBlackActive ? 'clock-active' : ''} ${isBlackLow ? 'clock-low' : ''}`}>
        <span className="clock-player">Black</span>
        <span className="clock-time">{formatTime(blackTime)}</span>
      </div>
    </div>
  );
}
