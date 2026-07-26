import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Settings,
  RefreshCw,
  FileCode,
  RotateCcw,
  Lightbulb,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Info
} from 'lucide-react';

import Board from './components/Board';
import EvalBar from './components/EvalBar';
import MoveHistory from './components/MoveHistory';
import CapturedPieces from './components/CapturedPieces';
import ChessClock from './components/ChessClock';
import PromotionModal from './components/PromotionModal';
import GameOverModal from './components/GameOverModal';
import FenPgnModal from './components/FenPgnModal';
import SettingsModal from './components/SettingsModal';

import {
  parseFEN,
  generateFEN,
  DEFAULT_FEN,
  getAllLegalMoves,
  getLegalMovesForSquare,
  makeMoveOnState,
  cloneGameState,
  formatSAN,
  evaluateGameEndStatus
} from './logic/chessEngine';

import { getBestMove, evaluatePosition } from './logic/aiEngine';
import { soundFx } from './logic/soundEngine';
import { parsePGN } from './logic/pgnParser';

export default function App() {
  // Settings State
  const [gameMode, setGameMode] = useState('pvai'); // 'pvai' | 'pvp' | 'aivsai'
  const [aiDifficulty, setAiDifficulty] = useState('intermediate');
  const [playerColor, setPlayerColor] = useState('w');
  const [timeControl, setTimeControl] = useState('unlimited');
  const [theme, setTheme] = useState('cyber-neon');
  const [soundMuted, setSoundMuted] = useState(false);
  const [autoFlip, setAutoFlip] = useState(false);
  const [showHints, setShowHints] = useState(true);

  // Game Engine State
  const [gameState, setGameState] = useState(() => parseFEN(DEFAULT_FEN));
  const [moveHistory, setMoveHistory] = useState([]);
  const [historyStates, setHistoryStates] = useState([parseFEN(DEFAULT_FEN)]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [hintMove, setHintMove] = useState(null);

  // Board View State
  const [boardFlipped, setBoardFlipped] = useState(playerColor === 'b');

  // Modals & Pending Actions
  const [promotionPending, setPromotionPending] = useState(null); // move waiting for promo choice
  const [gameEnd, setGameEnd] = useState(null); // { isGameOver, result, winner }
  const [showSettings, setShowSettings] = useState(false);
  const [showFenPgn, setShowFenPgn] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // Clock State (in seconds)
  const getSecondsForControl = (ctrl) => {
    switch (ctrl) {
      case '1+0': return 60;
      case '3+0': return 180;
      case '5+0': return 300;
      case '10+0': return 600;
      case '15+10': return 900;
      default: return 0;
    }
  };

  const [whiteTime, setWhiteTime] = useState(getSecondsForControl(timeControl));
  const [blackTime, setBlackTime] = useState(getSecondsForControl(timeControl));
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Sync sound mute setting
  useEffect(() => {
    soundFx.muted = soundMuted;
  }, [soundMuted]);

  // Keep board orientation updated based on player color in vs AI
  useEffect(() => {
    if (gameMode === 'pvai') {
      setBoardFlipped(playerColor === 'b');
    }
  }, [playerColor, gameMode]);

  // Reset/Start New Game
  const startNewGame = useCallback((fen = DEFAULT_FEN) => {
    const initialState = parseFEN(fen);
    setGameState(initialState);
    setMoveHistory([]);
    setHistoryStates([initialState]);
    setCurrentMoveIndex(-1);
    setSelectedSquare(null);
    setLastMove(null);
    setHintMove(null);
    setPromotionPending(null);
    setGameEnd(null);
    setShowGameOverModal(false);

    const initTime = getSecondsForControl(timeControl);
    setWhiteTime(initTime);
    setBlackTime(initTime);
    setIsTimerRunning(false);

    soundFx.playGameStart();
  }, [timeControl]);

  // Current effective state based on history index
  const activeState = currentMoveIndex === -1
    ? historyStates[0]
    : historyStates[currentMoveIndex + 1] || gameState;

  // Legal moves for current state
  const legalMoves = getAllLegalMoves(activeState);

  // Position Evaluation Score
  const evalScore = evaluatePosition(activeState);

  // Execute Move handler
  const executeMove = useCallback((move) => {
    // If move requires pawn promotion and choice not selected yet, prompt modal
    if (move.piece.type === 'p' && !move.promotion) {
      const isPromoRow = move.piece.color === 'w' ? move.toRow === 0 : move.toRow === 7;
      if (isPromoRow) {
        setPromotionPending(move);
        return;
      }
    }

    const stateBefore = activeState;
    const nextState = cloneGameState(stateBefore);
    
    // Play move sound
    if (move.isCastling) {
      soundFx.playCastle();
    } else if (move.captured || move.isEnPassant) {
      soundFx.playCapture();
    } else if (move.promotion) {
      soundFx.playPromote();
    } else {
      soundFx.playMove();
    }

    makeMoveOnState(nextState, move);

    const san = formatSAN(stateBefore, move, legalMoves);
    const updatedHistory = [...moveHistory.slice(0, currentMoveIndex + 1), { ...move, san }];
    const updatedStates = [...historyStates.slice(0, currentMoveIndex + 2), nextState];

    setGameState(nextState);
    setMoveHistory(updatedHistory);
    setHistoryStates(updatedStates);
    setCurrentMoveIndex(updatedHistory.length - 1);
    setSelectedSquare(null);
    setLastMove({ fromRow: move.fromRow, fromCol: move.fromCol, toRow: move.toRow, toCol: move.toCol });
    setHintMove(null);
    setPromotionPending(null);
    setIsTimerRunning(true);

    // Play Check Sound if check
    const checkEnd = evaluateGameEndStatus(nextState);
    if (!checkEnd.isGameOver) {
      const inCheck = nextState.board.some(row => row.some(cell => cell?.type === 'k' && cell.color === nextState.turn))
        ? evaluatePosition(nextState) !== 0
        : false;
      // if check sound
    }

    // Auto flip board in local 2 player mode if enabled
    if (gameMode === 'pvp' && autoFlip) {
      setBoardFlipped(nextState.turn === 'b');
    }

    // Evaluate Game End
    if (checkEnd.isGameOver) {
      setGameEnd(checkEnd);
      setShowGameOverModal(true);
      setIsTimerRunning(false);
    }
  }, [activeState, currentMoveIndex, historyStates, moveHistory, legalMoves, gameMode, autoFlip]);

  // Handle Promotion Choice
  const handlePromotionSelect = (promoType) => {
    if (promotionPending) {
      const fullMove = { ...promotionPending, promotion: promoType };
      setPromotionPending(null);
      executeMove(fullMove);
    }
  };

  // AI Turn Automation Effect
  useEffect(() => {
    if (gameEnd?.isGameOver) return;
    if (currentMoveIndex !== moveHistory.length - 1) return; // don't play AI when reviewing past history

    const isAiTurn =
      (gameMode === 'pvai' && activeState.turn !== playerColor) ||
      (gameMode === 'aivsai');

    if (isAiTurn) {
      const timer = setTimeout(() => {
        const aiMove = getBestMove(activeState, aiDifficulty);
        if (aiMove) {
          executeMove(aiMove);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [activeState, gameMode, playerColor, aiDifficulty, currentMoveIndex, moveHistory.length, gameEnd, executeMove]);

  // Clock Timeout Handler
  const handleTimeOut = useCallback((color) => {
    const winner = color === 'w' ? 'b' : 'w';
    setGameEnd({ isGameOver: true, result: 'timeout', winner });
    setShowGameOverModal(true);
    setIsTimerRunning(false);
  }, []);

  // Square Selection logic
  const handleSelectSquare = (row, col) => {
    if (gameEnd?.isGameOver) return;

    // If reviewing past moves, disable moving until returned to current position
    if (currentMoveIndex !== moveHistory.length - 1 && moveHistory.length > 0) {
      setCurrentMoveIndex(moveHistory.length - 1);
      return;
    }

    const clickedPiece = activeState.board[row][col];

    if (selectedSquare) {
      // Check if clicking a legal move destination
      const targetMove = legalMoves.find(
        m => m.fromRow === selectedSquare.row &&
             m.fromCol === selectedSquare.col &&
             m.toRow === row &&
             m.toCol === col
      );

      if (targetMove) {
        executeMove(targetMove);
        return;
      }
    }

    // If clicking own piece, select it
    if (clickedPiece && clickedPiece.color === activeState.turn) {
      setSelectedSquare({ row, col });
    } else {
      setSelectedSquare(null);
    }
  };

  // Move Hint Helper
  const handleGetHint = () => {
    const best = getBestMove(activeState, 'advanced');
    if (best) {
      setHintMove(best);
      soundFx.playCheck();
    }
  };

  // Jump to specific move index in history
  const handleJumpToMove = (index) => {
    const validIndex = Math.max(-1, Math.min(moveHistory.length - 1, index));
    setCurrentMoveIndex(validIndex);
    setSelectedSquare(null);
    setHintMove(null);
  };

  // Import FEN string
  const handleImportFEN = (fenStr) => {
    startNewGame(fenStr);
  };

  // Import PGN string
  const handleImportPGN = (pgnStr) => {
    const { fen, moveTokens } = parsePGN(pgnStr);
    let state = parseFEN(fen);
    const history = [];
    const states = [state];

    // Play back tokens
    for (const token of moveTokens) {
      const legals = getAllLegalMoves(state);
      // find matching move
      const match = legals.find(m => {
        const san = formatSAN(state, m, legals);
        return san.replace(/[+#=]/g, '') === token.replace(/[+#=]/g, '');
      });
      if (match) {
        const san = formatSAN(state, match, legals);
        makeMoveOnState(state, match);
        history.push({ ...match, san });
        states.push(cloneGameState(state));
      } else {
        break;
      }
    }

    setGameState(state);
    setMoveHistory(history);
    setHistoryStates(states);
    setCurrentMoveIndex(history.length - 1);
  };

  return (
    <div className={`app-root theme-${theme}`}>
      {/* Top Header Bar */}
      <header className="app-header">
        <div className="brand-group">
          <div className="chess-logo">♚</div>
          <h1 className="app-title">ANTIGRAVITY CHESS</h1>
          <span className="version-badge">2.0 PRO</span>
        </div>

        <div className="header-actions">
          <button className="hdr-btn" onClick={() => startNewGame()} title="New Game">
            <RefreshCw size={18} /> <span className="btn-lbl">New Game</span>
          </button>
          <button className="hdr-btn" onClick={() => handleGetHint()} title="Hint Move">
            <Lightbulb size={18} color="#f59e0b" /> <span className="btn-lbl">Hint</span>
          </button>
          <button className="hdr-btn" onClick={() => setShowFenPgn(true)} title="PGN / FEN Utility">
            <FileCode size={18} /> <span className="btn-lbl">PGN / FEN</span>
          </button>
          <button className="hdr-btn" onClick={() => setBoardFlipped(!boardFlipped)} title="Flip Board View">
            <FlipHorizontal size={18} />
          </button>
          <button className="hdr-btn" onClick={() => setShowSettings(true)} title="Settings">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Game Container Layout */}
      <main className="game-layout">
        {/* Left Side: Eval Bar & Chess Board */}
        <section className="board-section">
          {/* Top Captured Pieces */}
          <div className="player-meta-bar">
            <div className="player-info">
              <span className={`player-dot ${activeState.turn === (boardFlipped ? 'w' : 'b') ? 'active-dot' : ''}`} />
              <span className="player-name">{boardFlipped ? 'White' : 'Black'}</span>
              {(gameMode === 'pvai' && (boardFlipped ? playerColor === 'b' : playerColor === 'w')) && (
                <span className="ai-tag">AI ({aiDifficulty})</span>
              )}
            </div>
            <CapturedPieces capturedPieces={activeState.capturedPieces} color={boardFlipped ? 'w' : 'b'} />
          </div>

          <div className="board-row">
            <EvalBar score={evalScore} boardFlipped={boardFlipped} />

            <Board
              gameState={activeState}
              legalMoves={currentMoveIndex === moveHistory.length - 1 ? legalMoves : []}
              selectedSquare={selectedSquare}
              lastMove={lastMove}
              hintMove={hintMove}
              boardFlipped={boardFlipped}
              showCoords={true}
              onSelectSquare={handleSelectSquare}
              onExecuteMove={executeMove}
            />
          </div>

          {/* Bottom Captured Pieces */}
          <div className="player-meta-bar">
            <div className="player-info">
              <span className={`player-dot ${activeState.turn === (boardFlipped ? 'b' : 'w') ? 'active-dot' : ''}`} />
              <span className="player-name">{boardFlipped ? 'Black' : 'White'}</span>
              {(gameMode === 'pvai' && (boardFlipped ? playerColor === 'w' : playerColor === 'b')) && (
                <span className="ai-tag">AI ({aiDifficulty})</span>
              )}
            </div>
            <CapturedPieces capturedPieces={activeState.capturedPieces} color={boardFlipped ? 'b' : 'w'} />
          </div>
        </section>

        {/* Right Side: Clock & Move Notation Control Panel */}
        <section className="side-panel">
          <ChessClock
            whiteTime={whiteTime}
            blackTime={blackTime}
            activeTurn={activeState.turn}
            isTimerRunning={isTimerRunning}
            onTimeOut={handleTimeOut}
            timeControl={timeControl}
          />

          <MoveHistory
            moveHistory={moveHistory}
            currentMoveIndex={currentMoveIndex}
            onJumpToMove={handleJumpToMove}
          />

          <div className="status-footer-card">
            <div className="status-row">
              <span className="status-label">Turn:</span>
              <span className="status-val">{activeState.turn === 'w' ? 'White to move' : 'Black to move'}</span>
            </div>
            <div className="status-row">
              <span className="status-label">Mode:</span>
              <span className="status-val">{gameMode.toUpperCase()} ({aiDifficulty})</span>
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      {promotionPending && (
        <PromotionModal
          color={promotionPending.piece.color}
          onSelectPromotion={handlePromotionSelect}
        />
      )}

      {showGameOverModal && gameEnd && (
        <GameOverModal
          gameEnd={gameEnd}
          onNewGame={() => startNewGame()}
          onCloseModal={() => setShowGameOverModal(false)}
        />
      )}

      {showFenPgn && (
        <FenPgnModal
          gameState={activeState}
          onImportFEN={handleImportFEN}
          onImportPGN={handleImportPGN}
          onClose={() => setShowFenPgn(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          gameMode={gameMode}
          setGameMode={setGameMode}
          aiDifficulty={aiDifficulty}
          setAiDifficulty={setAiDifficulty}
          playerColor={playerColor}
          setPlayerColor={setPlayerColor}
          timeControl={timeControl}
          setTimeControl={setTimeControl}
          theme={theme}
          setTheme={setTheme}
          soundMuted={soundMuted}
          setSoundMuted={setSoundMuted}
          autoFlip={autoFlip}
          setAutoFlip={setAutoFlip}
          showHints={showHints}
          setShowHints={setShowHints}
          onClose={() => setShowSettings(false)}
          onNewGame={() => startNewGame()}
        />
      )}
    </div>
  );
}
