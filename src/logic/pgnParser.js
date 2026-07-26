// PGN (Portable Game Notation) & FEN Import / Export Utilities

import { parseFEN, generateFEN, DEFAULT_FEN } from './chessEngine';

export function exportPGN(moveHistory, result = '*') {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '.');
  let headers = [
    `[Event "Local Chess Game"]`,
    `[Site "Antigravity Chess"]`,
    `[Date "${dateStr}"]`,
    `[Round "1"]`,
    `[White "White Player"]`,
    `[Black "Black Player"]`,
    `[Result "${result}"]`
  ].join('\n');

  let moveText = '';
  for (let i = 0; i < moveHistory.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const whiteMove = moveHistory[i]?.san || '';
    const blackMove = moveHistory[i + 1]?.san || '';

    moveText += `${moveNum}. ${whiteMove} ${blackMove} `.trim() + ' ';
  }

  moveText += result;

  return `${headers}\n\n${moveText.trim()}`;
}

export function parsePGN(pgnString) {
  // Simplistic PGN parser to extract SAN moves and starting FEN if any
  const lines = pgnString.split('\n');
  let fen = DEFAULT_FEN;
  let moveTokens = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[FEN "')) {
      const match = trimmed.match(/\[FEN "(.*?)"\]/);
      if (match) fen = match[1];
    } else if (!trimmed.startsWith('[')) {
      // Extract move tokens like 1. e4 e5 2. Nf3 Nc6
      const sanitized = trimmed.replace(/\{.*?\}/g, '').replace(/\(.*?\)/g, ''); // remove comments
      const tokens = sanitized.split(/\s+/).filter(t => t && !/^\d+\.$/.test(t) && !/^\d+\.\.\.$/.test(t) && t !== '1-0' && t !== '0-1' && t !== '1/2-1/2' && t !== '*');
      moveTokens.push(...tokens);
    }
  }

  return { fen, moveTokens };
}
