import React from 'react';
import { X, Volume2, VolumeX, Sparkles, Monitor, Cpu } from 'lucide-react';
import { soundFx } from '../logic/soundEngine';

export default function SettingsModal({
  gameMode,
  setGameMode,
  aiDifficulty,
  setAiDifficulty,
  playerColor,
  setPlayerColor,
  timeControl,
  setTimeControl,
  theme,
  setTheme,
  soundMuted,
  setSoundMuted,
  autoFlip,
  setAutoFlip,
  showHints,
  setShowHints,
  onClose,
  onNewGame
}) {
  const toggleSound = () => {
    const nextMuted = !soundMuted;
    setSoundMuted(nextMuted);
    soundFx.muted = nextMuted;
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content settings-modal glass-card">
        <div className="modal-header">
          <h3>Game Settings</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="settings-body">
          {/* Game Mode */}
          <div className="setting-row">
            <label className="setting-label"><Cpu size={18} /> Game Mode</label>
            <div className="setting-options">
              <button
                className={`opt-btn ${gameMode === 'pvai' ? 'active' : ''}`}
                onClick={() => setGameMode('pvai')}
              >
                vs AI
              </button>
              <button
                className={`opt-btn ${gameMode === 'pvp' ? 'active' : ''}`}
                onClick={() => setGameMode('pvp')}
              >
                2 Player (Local)
              </button>
              <button
                className={`opt-btn ${gameMode === 'aivsai' ? 'active' : ''}`}
                onClick={() => setGameMode('aivsai')}
              >
                AI vs AI
              </button>
            </div>
          </div>

          {/* AI Difficulty */}
          {gameMode !== 'pvp' && (
            <div className="setting-row">
              <label className="setting-label">AI Difficulty</label>
              <div className="setting-options">
                {['beginner', 'intermediate', 'advanced', 'master'].map(diff => (
                  <button
                    key={diff}
                    className={`opt-btn ${aiDifficulty === diff ? 'active' : ''}`}
                    onClick={() => setAiDifficulty(diff)}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player Color in vs AI */}
          {gameMode === 'pvai' && (
            <div className="setting-row">
              <label className="setting-label">Play As</label>
              <div className="setting-options">
                <button
                  className={`opt-btn ${playerColor === 'w' ? 'active' : ''}`}
                  onClick={() => setPlayerColor('w')}
                >
                  White (First)
                </button>
                <button
                  className={`opt-btn ${playerColor === 'b' ? 'active' : ''}`}
                  onClick={() => setPlayerColor('b')}
                >
                  Black (Second)
                </button>
              </div>
            </div>
          )}

          {/* Board Theme */}
          <div className="setting-row">
            <label className="setting-label"><Sparkles size={18} /> Visual Theme</label>
            <div className="setting-options grid-opts">
              {[
                { id: 'cyber-neon', name: '🌌 Cyber Neon' },
                { id: 'mahogany-wood', name: '🪵 Mahogany Wood' },
                { id: 'frosted-glass', name: '💎 Frosted Glass' },
                { id: 'minimal-obsidian', name: '⚡ Minimal Obsidian' }
              ].map(t => (
                <button
                  key={t.id}
                  className={`opt-btn ${theme === t.id ? 'active' : ''}`}
                  onClick={() => setTheme(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Time Controls */}
          <div className="setting-row">
            <label className="setting-label">Time Control</label>
            <div className="setting-options grid-opts">
              {[
                { id: 'unlimited', name: 'Unlimited' },
                { id: '1+0', name: '1 min (Bullet)' },
                { id: '3+0', name: '3 min (Blitz)' },
                { id: '5+0', name: '5 min (Blitz)' },
                { id: '10+0', name: '10 min (Rapid)' },
                { id: '15+10', name: '15 min (Classical)' }
              ].map(tc => (
                <button
                  key={tc.id}
                  className={`opt-btn ${timeControl === tc.id ? 'active' : ''}`}
                  onClick={() => setTimeControl(tc.id)}
                >
                  {tc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="setting-row toggle-row">
            <label className="setting-label">Audio Effects</label>
            <button className="toggle-icon-btn" onClick={toggleSound}>
              {soundMuted ? <VolumeX size={20} color="#f87171" /> : <Volume2 size={20} color="#4ade80" />}
              <span>{soundMuted ? 'Muted' : 'Enabled'}</span>
            </button>
          </div>

          <div className="setting-row toggle-row">
            <label className="setting-label">Show Best Move Hints</label>
            <input
              type="checkbox"
              className="toggle-checkbox"
              checked={showHints}
              onChange={(e) => setShowHints(e.target.checked)}
            />
          </div>

          {gameMode === 'pvp' && (
            <div className="setting-row toggle-row">
              <label className="setting-label">Auto-Rotate Board Each Turn</label>
              <input
                type="checkbox"
                className="toggle-checkbox"
                checked={autoFlip}
                onChange={(e) => setAutoFlip(e.target.checked)}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="primary-btn wide-btn" onClick={() => { onNewGame(); onClose(); }}>
            Apply & Restart Game
          </button>
        </div>
      </div>
    </div>
  );
}
