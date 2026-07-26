// Comprehensive Chess Engine implementation in pure JavaScript

export const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
};

// Convert square coords (row 0..7, col 0..7) to algebraic notation (e.g., 0,0 -> 'a8', 7,7 -> 'h1')
export function squareToAlgebraic(row, col) {
  const file = String.fromCharCode(97 + col);
  const rank = 8 - row;
  return `${file}${rank}`;
}

// Convert algebraic string to {row, col}
export function algebraicToSquare(alg) {
  if (!alg || alg.length < 2) return null;
  const col = alg.charCodeAt(0) - 97;
  const row = 8 - parseInt(alg[1], 10);
  if (row < 0 || row > 7 || col < 0 || col > 7) return null;
  return { row, col };
}

// Parse FEN string into board state object
export function parseFEN(fen = DEFAULT_FEN) {
  const parts = fen.trim().split(/\s+/);
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  const rows = parts[0].split('/');
  for (let r = 0; r < 8; r++) {
    let c = 0;
    const rowStr = rows[r];
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (/\d/.test(char)) {
        c += parseInt(char, 10);
      } else {
        const color = char === char.toUpperCase() ? 'w' : 'b';
        const type = char.toLowerCase();
        board[r][c] = { type, color, hasMoved: false };
        c++;
      }
    }
  }

  const turn = parts[1] || 'w';
  const castlingStr = parts[2] || 'KQkq';
  const castlingRights = {
    w: { kingSide: castlingStr.includes('K'), queenSide: castlingStr.includes('Q') },
    b: { kingSide: castlingStr.includes('k'), queenSide: castlingStr.includes('q') }
  };

  const enPassantTarget = parts[3] && parts[3] !== '-' ? algebraicToSquare(parts[3]) : null;
  const halfMoveClock = parseInt(parts[4] || '0', 10);
  const fullMoveNumber = parseInt(parts[5] || '1', 10);

  return {
    board,
    turn,
    castlingRights,
    enPassantTarget,
    halfMoveClock,
    fullMoveNumber,
    moveHistory: [],
    capturedPieces: { w: [], b: [] },
    isGameOver: false,
    gameResult: null // 'checkmate', 'stalemate', 'insufficient', '50-move', 'timeout', 'resignation'
  };
}

// Generate FEN from game state
export function generateFEN(gameState) {
  const { board, turn, castlingRights, enPassantTarget, halfMoveClock, fullMoveNumber } = gameState;
  let fenRows = [];

  for (let r = 0; r < 8; r++) {
    let emptyCount = 0;
    let rowStr = '';
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        const char = p.color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
        rowStr += char;
      }
    }
    if (emptyCount > 0) rowStr += emptyCount;
    fenRows.push(rowStr);
  }

  let castlingStr = '';
  if (castlingRights.w.kingSide) castlingStr += 'K';
  if (castlingRights.w.queenSide) castlingStr += 'Q';
  if (castlingRights.b.kingSide) castlingStr += 'k';
  if (castlingRights.b.queenSide) castlingStr += 'q';
  if (!castlingStr) castlingStr = '-';

  const epStr = enPassantTarget ? squareToAlgebraic(enPassantTarget.row, enPassantTarget.col) : '-';

  return `${fenRows.join('/')} ${turn} ${castlingStr} ${epStr} ${halfMoveClock} ${fullMoveNumber}`;
}

// Clone board array
export function cloneBoard(board) {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

// Clone entire state for move evaluation
export function cloneGameState(state) {
  return {
    board: cloneBoard(state.board),
    turn: state.turn,
    castlingRights: {
      w: { ...state.castlingRights.w },
      b: { ...state.castlingRights.b }
    },
    enPassantTarget: state.enPassantTarget ? { ...state.enPassantTarget } : null,
    halfMoveClock: state.halfMoveClock,
    fullMoveNumber: state.fullMoveNumber,
    capturedPieces: {
      w: [...state.capturedPieces.w],
      b: [...state.capturedPieces.b]
    },
    moveHistory: [...state.moveHistory],
    isGameOver: state.isGameOver,
    gameResult: state.gameResult
  };
}

// Find square of King for a given color
export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

// Check if square (targetRow, targetCol) is under attack by the opposing color
export function isSquareAttacked(board, targetRow, targetCol, attackerColor) {
  // Pawn attacks
  const pawnDir = attackerColor === 'w' ? -1 : 1; // white attacks upwards (row decreases), black downwards
  const pawnAttackRow = targetRow - pawnDir;
  if (pawnAttackRow >= 0 && pawnAttackRow < 8) {
    for (const dCol of [-1, 1]) {
      const pCol = targetCol + dCol;
      if (pCol >= 0 && pCol < 8) {
        const p = board[pawnAttackRow][pCol];
        if (p && p.type === 'p' && p.color === attackerColor) return true;
      }
    }
  }

  // Knight attacks
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  for (const [dr, dc] of knightMoves) {
    const r = targetRow + dr;
    const c = targetCol + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p && p.type === 'n' && p.color === attackerColor) return true;
    }
  }

  // King attacks (adjacent)
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = targetRow + dr;
      const c = targetCol + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === attackerColor) return true;
      }
    }
  }

  // Ray attacks (Rook, Bishop, Queen)
  const directions = [
    { dr: -1, dc: 0, types: ['r', 'q'] },
    { dr: 1, dc: 0, types: ['r', 'q'] },
    { dr: 0, dc: -1, types: ['r', 'q'] },
    { dr: 0, dc: 1, types: ['r', 'q'] },
    { dr: -1, dc: -1, types: ['b', 'q'] },
    { dr: -1, dc: 1, types: ['b', 'q'] },
    { dr: 1, dc: -1, types: ['b', 'q'] },
    { dr: 1, dc: 1, types: ['b', 'q'] }
  ];

  for (const { dr, dc, types } of directions) {
    let r = targetRow + dr;
    let c = targetCol + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p) {
        if (p.color === attackerColor && types.includes(p.type)) {
          return true;
        }
        break; // blocked by any piece
      }
      r += dr;
      c += dc;
    }
  }

  return false;
}

// Check if king of color is in check
export function isKingInCheck(board, color) {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const enemyColor = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(board, kingPos.row, kingPos.col, enemyColor);
}

// Get pseudo-legal moves for piece at (fromRow, fromCol)
export function getPseudoLegalMoves(state, fromRow, fromCol) {
  const { board, castlingRights, enPassantTarget } = state;
  const piece = board[fromRow][fromCol];
  if (!piece) return [];

  const color = piece.color;
  const enemyColor = color === 'w' ? 'b' : 'w';
  const moves = [];

  const addMove = (toRow, toCol, extra = {}) => {
    moves.push({
      fromRow,
      fromCol,
      toRow,
      toCol,
      piece: { ...piece },
      captured: board[toRow][toCol] ? { ...board[toRow][toCol] } : null,
      ...extra
    });
  };

  if (piece.type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;

    // Single step forward
    const nextRow = fromRow + dir;
    if (nextRow >= 0 && nextRow < 8 && !board[nextRow][fromCol]) {
      const isPromotion = color === 'w' ? nextRow === 0 : nextRow === 7;
      if (isPromotion) {
        ['q', 'r', 'b', 'n'].forEach(promo => {
          addMove(nextRow, fromCol, { promotion: promo });
        });
      } else {
        addMove(nextRow, fromCol);

        // Double step forward
        const doubleRow = fromRow + 2 * dir;
        if (fromRow === startRow && !board[doubleRow][fromCol]) {
          addMove(doubleRow, fromCol, { isDoublePawn: true });
        }
      }
    }

    // Normal captures
    for (const dCol of [-1, 1]) {
      const capCol = fromCol + dCol;
      if (nextRow >= 0 && nextRow < 8 && capCol >= 0 && capCol < 8) {
        const targetPiece = board[nextRow][capCol];
        if (targetPiece && targetPiece.color === enemyColor) {
          const isPromotion = color === 'w' ? nextRow === 0 : nextRow === 7;
          if (isPromotion) {
            ['q', 'r', 'b', 'n'].forEach(promo => {
              addMove(nextRow, capCol, { promotion: promo });
            });
          } else {
            addMove(nextRow, capCol);
          }
        } else if (enPassantTarget && enPassantTarget.row === nextRow && enPassantTarget.col === capCol) {
          // En Passant capture
          addMove(nextRow, capCol, {
            isEnPassant: true,
            captured: { type: 'p', color: enemyColor }
          });
        }
      }
    }
  } else if (piece.type === 'n') {
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightOffsets) {
      const r = fromRow + dr;
      const c = fromCol + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = board[r][c];
        if (!target || target.color === enemyColor) {
          addMove(r, c);
        }
      }
    }
  } else if (piece.type === 'k') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = fromRow + dr;
        const c = fromCol + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const target = board[r][c];
          if (!target || target.color === enemyColor) {
            addMove(r, c);
          }
        }
      }
    }

    // Castling
    if (!isKingInCheck(board, color)) {
      const rights = castlingRights[color];
      const rank = color === 'w' ? 7 : 0;
      if (fromRow === rank && fromCol === 4) {
        // Kingside O-O
        if (rights.kingSide && !board[rank][5] && !board[rank][6]) {
          if (!isSquareAttacked(board, rank, 5, enemyColor) && !isSquareAttacked(board, rank, 6, enemyColor)) {
            addMove(rank, 6, { isCastling: 'kingSide' });
          }
        }
        // Queenside O-O-O
        if (rights.queenSide && !board[rank][1] && !board[rank][2] && !board[rank][3]) {
          if (!isSquareAttacked(board, rank, 2, enemyColor) && !isSquareAttacked(board, rank, 3, enemyColor)) {
            addMove(rank, 2, { isCastling: 'queenSide' });
          }
        }
      }
    }
  } else {
    // Sliding pieces: Bishop, Rook, Queen
    const dirs = [];
    if (piece.type === 'b' || piece.type === 'q') {
      dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (piece.type === 'r' || piece.type === 'q') {
      dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }

    for (const [dr, dc] of dirs) {
      let r = fromRow + dr;
      let c = fromCol + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = board[r][c];
        if (!target) {
          addMove(r, c);
        } else {
          if (target.color === enemyColor) {
            addMove(r, c);
          }
          break; // hit a piece
        }
        r += dr;
        c += dc;
      }
    }
  }

  return moves;
}

// Execute move on board state (mutates clone)
export function makeMoveOnState(state, move) {
  const { fromRow, fromCol, toRow, toCol, promotion, isCastling, isEnPassant } = move;
  const board = state.board;
  const movingPiece = board[fromRow][fromCol];
  const color = movingPiece.color;
  const enemyColor = color === 'w' ? 'b' : 'w';

  let capturedPiece = board[toRow][toCol];

  // En Passant capture target piece cleanup
  if (isEnPassant) {
    const epPawnRow = color === 'w' ? toRow + 1 : toRow - 1;
    capturedPiece = board[epPawnRow][toCol];
    board[epPawnRow][toCol] = null;
  }

  // Update piece position
  board[toRow][toCol] = { ...movingPiece, hasMoved: true };
  board[fromRow][fromCol] = null;

  // Handle Pawn Promotion
  if (promotion) {
    board[toRow][toCol].type = promotion;
  }

  // Handle Castling Rook repositioning
  if (isCastling === 'kingSide') {
    const rookFrom = 7;
    const rookTo = 5;
    board[toRow][rookTo] = { ...board[toRow][rookFrom], hasMoved: true };
    board[toRow][rookFrom] = null;
  } else if (isCastling === 'queenSide') {
    const rookFrom = 0;
    const rookTo = 3;
    board[toRow][rookTo] = { ...board[toRow][rookFrom], hasMoved: true };
    board[toRow][rookFrom] = null;
  }

  // Update Castling Rights if King or Rook moved or Rook was captured
  if (movingPiece.type === 'k') {
    state.castlingRights[color].kingSide = false;
    state.castlingRights[color].queenSide = false;
  }
  if (movingPiece.type === 'r') {
    if (fromRow === (color === 'w' ? 7 : 0)) {
      if (fromCol === 0) state.castlingRights[color].queenSide = false;
      if (fromCol === 7) state.castlingRights[color].kingSide = false;
    }
  }
  // If opponent rook is captured in corner
  if (capturedPiece && capturedPiece.type === 'r') {
    if (toRow === (enemyColor === 'w' ? 7 : 0)) {
      if (toCol === 0) state.castlingRights[enemyColor].queenSide = false;
      if (toCol === 7) state.castlingRights[enemyColor].kingSide = false;
    }
  }

  // Track En Passant target
  if (movingPiece.type === 'p' && Math.abs(toRow - fromRow) === 2) {
    state.enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
  } else {
    state.enPassantTarget = null;
  }

  // Record captured piece
  if (capturedPiece) {
    state.capturedPieces[color].push(capturedPiece.type);
    state.halfMoveClock = 0;
  } else if (movingPiece.type === 'p') {
    state.halfMoveClock = 0;
  } else {
    state.halfMoveClock++;
  }

  if (color === 'b') {
    state.fullMoveNumber++;
  }

  // Switch Turn
  state.turn = enemyColor;

  return capturedPiece;
}

// Filter pseudo-legal moves for actual legal moves (which don't leave king in check)
export function getLegalMovesForSquare(state, row, col) {
  const pseudo = getPseudoLegalMoves(state, row, col);
  const color = state.board[row][col]?.color;
  if (!color) return [];

  return pseudo.filter(move => {
    const nextState = cloneGameState(state);
    makeMoveOnState(nextState, move);
    return !isKingInCheck(nextState.board, color);
  });
}

// Get all legal moves for current player
export function getAllLegalMoves(state) {
  const legalMoves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (state.board[r][c] && state.board[r][c].color === state.turn) {
        const moves = getLegalMovesForSquare(state, r, c);
        legalMoves.push(...moves);
      }
    }
  }
  return legalMoves;
}

// Format move to Standard Algebraic Notation (SAN)
export function formatSAN(stateBefore, move, legalMoves) {
  const { fromRow, fromCol, toRow, toCol, piece, captured, promotion, isCastling } = move;

  if (isCastling === 'kingSide') return 'O-O';
  if (isCastling === 'queenSide') return 'O-O-O';

  let san = '';
  const pieceChar = piece.type.toUpperCase();

  if (piece.type === 'p') {
    if (captured || move.isEnPassant) {
      const fromFile = String.fromCharCode(97 + fromCol);
      san += `${fromFile}x${squareToAlgebraic(toRow, toCol)}`;
    } else {
      san += squareToAlgebraic(toRow, toCol);
    }
    if (promotion) {
      san += `=${promotion.toUpperCase()}`;
    }
  } else {
    san += pieceChar;

    // Disambiguation if multiple pieces of same type can reach target square
    const ambiguousPieces = legalMoves.filter(m => 
      m.fromRow !== fromRow || m.fromCol !== fromCol ? (
        stateBefore.board[m.fromRow][m.fromCol]?.type === piece.type &&
        m.toRow === toRow && m.toCol === toCol
      ) : false
    );

    if (ambiguousPieces.length > 0) {
      const sameFile = ambiguousPieces.some(m => m.fromCol === fromCol);
      const sameRank = ambiguousPieces.some(m => m.fromRow === fromRow);

      if (!sameFile) {
        san += String.fromCharCode(97 + fromCol);
      } else if (!sameRank) {
        san += (8 - fromRow);
      } else {
        san += squareToAlgebraic(fromRow, fromCol);
      }
    }

    if (captured) {
      san += 'x';
    }
    san += squareToAlgebraic(toRow, toCol);
  }

  // Simulate next state for check/checkmate symbol
  const nextState = cloneGameState(stateBefore);
  makeMoveOnState(nextState, move);
  const isCheck = isKingInCheck(nextState.board, nextState.turn);
  const nextLegalMoves = getAllLegalMoves(nextState);

  if (isCheck) {
    if (nextLegalMoves.length === 0) {
      san += '#';
    } else {
      san += '+';
    }
  }

  return san;
}

// Calculate material score difference (White - Black)
export function getMaterialDifference(capturedPieces) {
  let whiteScore = 0;
  let blackScore = 0;

  capturedPieces.w.forEach(p => { whiteScore += PIECE_VALUES[p] || 0; });
  capturedPieces.b.forEach(p => { blackScore += PIECE_VALUES[p] || 0; });

  return whiteScore - blackScore;
}

// Check game end conditions
export function evaluateGameEndStatus(state) {
  const legalMoves = getAllLegalMoves(state);
  const inCheck = isKingInCheck(state.board, state.turn);

  if (legalMoves.length === 0) {
    if (inCheck) {
      return { isGameOver: true, result: 'checkmate', winner: state.turn === 'w' ? 'b' : 'w' };
    } else {
      return { isGameOver: true, result: 'stalemate', winner: null };
    }
  }

  if (state.halfMoveClock >= 100) {
    return { isGameOver: true, result: '50-move', winner: null };
  }

  if (hasInsufficientMaterial(state.board)) {
    return { isGameOver: true, result: 'insufficient', winner: null };
  }

  return { isGameOver: false, result: null, winner: null };
}

// Insufficient material check (K vs K, K+B vs K, K+N vs K, K+B vs K+B with same colored bishops)
function hasInsufficientMaterial(board) {
  const pieces = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]) {
        pieces.push({ ...board[r][c], row: r, col: c });
      }
    }
  }

  if (pieces.length === 2) return true; // K vs K
  if (pieces.length === 3) {
    const nonKing = pieces.find(p => p.type !== 'k');
    if (nonKing && (nonKing.type === 'b' || nonKing.type === 'n')) {
      return true; // K+B vs K or K+N vs K
    }
  }
  if (pieces.length === 4) {
    const b1 = pieces.filter(p => p.type === 'b');
    if (b1.length === 2 && b1[0].color !== b1[1].color) {
      const squareColor1 = (b1[0].row + b1[0].col) % 2;
      const squareColor2 = (b1[1].row + b1[1].col) % 2;
      if (squareColor1 === squareColor2) return true; // K+B vs K+B (same color square)
    }
  }

  return false;
}
