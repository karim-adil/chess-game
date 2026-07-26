import React, { useState } from 'react';
import { Copy, Check, Download, Upload, X } from 'lucide-react';
import { exportPGN } from '../logic/pgnParser';
import { generateFEN } from '../logic/chessEngine';

export default function FenPgnModal({ gameState, onImportFEN, onImportPGN, onClose }) {
  const [activeTab, setActiveTab] = useState('pgn'); // 'pgn' | 'fen'
  const [fenInput, setFenInput] = useState(generateFEN(gameState));
  const [pgnInput, setPgnInput] = useState(exportPGN(gameState.moveHistory, gameState.gameResult || '*'));
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const currentFEN = generateFEN(gameState);
  const currentPGN = exportPGN(gameState.moveHistory, gameState.gameResult || '*');

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    setError('');
    try {
      if (activeTab === 'fen') {
        onImportFEN(fenInput);
        onClose();
      } else {
        onImportPGN(pgnInput);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Invalid format string');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content import-export-modal glass-card">
        <div className="modal-header">
          <h3>PGN / FEN Utility</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'pgn' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pgn'); setError(''); }}
          >
            PGN Game Log
          </button>
          <button
            className={`tab-btn ${activeTab === 'fen' ? 'active' : ''}`}
            onClick={() => { setActiveTab('fen'); setError(''); }}
          >
            FEN Position
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'pgn' ? (
            <div className="input-group">
              <label>PGN Move Text:</label>
              <textarea
                className="code-textarea"
                rows={7}
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
              />
              <div className="modal-toolbar">
                <button className="secondary-btn" onClick={() => handleCopy(currentPGN)}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} Copy PGN
                </button>
                <button className="primary-btn" onClick={handleImport}>
                  <Upload size={16} /> Import PGN
                </button>
              </div>
            </div>
          ) : (
            <div className="input-group">
              <label>FEN String:</label>
              <input
                type="text"
                className="code-input"
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
              />
              <div className="modal-toolbar">
                <button className="secondary-btn" onClick={() => handleCopy(currentFEN)}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} Copy FEN
                </button>
                <button className="primary-btn" onClick={handleImport}>
                  <Upload size={16} /> Load FEN
                </button>
              </div>
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}
        </div>
      </div>
    </div>
  );
}
