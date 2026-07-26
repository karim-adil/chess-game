// Built-in Chess AI Engine using Minimax with Alpha-Beta Pruning & Positional Tables

import { getAllLegalMoves, makeMoveOnState, cloneGameState, isKingInCheck, evaluateGameEndStatus } from './chessEngine';

// Piece Base Values in Centipawns
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Piece-Square Tables (PST) from White perspective (Row 0 = Rank 8, Row 7 = Rank 1)
const PAWN_PST = [
  [ 0,   0,   0,   0,   0,   0,   0,   0],
  [50,  50,  50,  50,  50,  50,  50,  50],
  [10,  10,  20,  30,  30,  20,  10,  10],
  [ 5,   5,  10,  25,  25,  10,   5,   5],
  [ 0,   0,   0,  20,  20,   0,   0,   0],
  [ 5,  -5, -10,   0,   0, -10,  -5,   5],
  [ 5,  10,  10, -20, -20,  10,  10,   5],
  [ 0,   0,   0,   0,   0,   0,   0,   0]
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_PST = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [ 0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_PST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_MIDDLEGAME_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20]
];

const PST_MAP = {
  p: PAWN_PST,
  n: KNIGHT_PST,
  b: BISHOP_PST,
  r: ROOK_PST,
  q: QUEEN_PST,
  k: KING_MIDDLEGAME_PST
};

// Evaluate static position score (positive = White leads, negative = Black leads)
export function evaluatePosition(state) {
  const { board } = state;
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseVal = PIECE_VALUES[piece.type];
      const pst = PST_MAP[piece.type];
      
      // PST row indexing for black (flip vertically)
      const pstRow = piece.color === 'w' ? r : 7 - r;
      const pstVal = pst ? pst[pstRow][c] : 0;

      const totalVal = baseVal + pstVal;

      if (piece.color === 'w') {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  // Bonus for check condition
  if (isKingInCheck(board, 'b')) score += 40;
  if (isKingInCheck(board, 'w')) score -= 40;

  return score;
}

// Order moves to optimize Alpha-Beta pruning (Captures MVV-LVA first, then Promotions)
function orderMoves(state, moves) {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Captures: Victim value - Attacker value
    if (a.captured) {
      scoreA += 10 * PIECE_VALUES[a.captured.type] - PIECE_VALUES[a.piece.type];
    }
    if (b.captured) {
      scoreB += 10 * PIECE_VALUES[b.captured.type] - PIECE_VALUES[b.piece.type];
    }

    // Promotions
    if (a.promotion) scoreA += 800;
    if (b.promotion) scoreB += 800;

    return scoreB - scoreA;
  });
}

// Quiescence Search for capturing moves to prevent horizon effect
function quiescenceSearch(state, alpha, beta, isMaximizing, maxDepth = 2) {
  const standPat = evaluatePosition(state);

  if (isMaximizing) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  if (maxDepth <= 0) return standPat;

  const legalMoves = getAllLegalMoves(state);
  const captureMoves = orderMoves(state, legalMoves.filter(m => m.captured || m.promotion));

  if (isMaximizing) {
    let maxEval = standPat;
    for (const move of captureMoves) {
      const nextState = cloneGameState(state);
      makeMoveOnState(nextState, move);
      const evalScore = quiescenceSearch(nextState, alpha, beta, false, maxDepth - 1);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = standPat;
    for (const move of captureMoves) {
      const nextState = cloneGameState(state);
      makeMoveOnState(nextState, move);
      const evalScore = quiescenceSearch(nextState, alpha, beta, true, maxDepth - 1);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Minimax with Alpha-Beta Pruning
function minimax(state, depth, alpha, beta, isMaximizing, useQuiescence = false) {
  const gameEnd = evaluateGameEndStatus(state);
  if (gameEnd.isGameOver) {
    if (gameEnd.result === 'checkmate') {
      return gameEnd.winner === 'w' ? 100000 + depth : -100000 - depth;
    }
    return 0; // Draw (stalemate/insufficient/50-move)
  }

  if (depth === 0) {
    if (useQuiescence) {
      return quiescenceSearch(state, alpha, beta, isMaximizing);
    }
    return evaluatePosition(state);
  }

  const moves = orderMoves(state, getAllLegalMoves(state));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextState = cloneGameState(state);
      makeMoveOnState(nextState, move);
      const evalScore = minimax(nextState, depth - 1, alpha, beta, false, useQuiescence);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextState = cloneGameState(state);
      makeMoveOnState(nextState, move);
      const evalScore = minimax(nextState, depth - 1, alpha, beta, true, useQuiescence);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Compute the best move for given difficulty level
export function getBestMove(state, difficulty = 'intermediate') {
  const legalMoves = getAllLegalMoves(state);
  if (legalMoves.length === 0) return null;

  // Beginner: random move 30% of the time, depth 1 otherwise
  if (difficulty === 'beginner') {
    if (Math.random() < 0.3) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
  }

  let searchDepth = 2;
  let useQuiescence = false;

  switch (difficulty) {
    case 'beginner':
      searchDepth = 1;
      break;
    case 'intermediate':
      searchDepth = 2;
      break;
    case 'advanced':
      searchDepth = 3;
      break;
    case 'master':
      searchDepth = 3; // depth 3 + Quiescence capture extension
      useQuiescence = true;
      break;
    default:
      searchDepth = 2;
  }

  const isMaximizing = state.turn === 'w';
  const orderedMoves = orderMoves(state, legalMoves);

  let bestMove = orderedMoves[0];
  let bestEval = isMaximizing ? -Infinity : Infinity;

  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of orderedMoves) {
    const nextState = cloneGameState(state);
    makeMoveOnState(nextState, move);

    const evalScore = minimax(nextState, searchDepth - 1, alpha, beta, !isMaximizing, useQuiescence);

    if (isMaximizing) {
      if (evalScore > bestEval) {
        bestEval = evalScore;
        bestMove = move;
      }
      alpha = Math.max(alpha, evalScore);
    } else {
      if (evalScore < bestEval) {
        bestEval = evalScore;
        bestMove = move;
      }
      beta = Math.min(beta, evalScore);
    }
  }

  return bestMove;
}
