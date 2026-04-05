/**
 * @typedef {import('../game/engine.js').GameState} GameState
 */

/**
 * Daily puzzle index for share line (1-based).
 *
 * @param {string} isoDate
 * @returns {number}
 */
function puzzleNumber(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const ord = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return ord - 19_000 + 1;
}

/**
 * Builds spoiler-free share text with emoji grid.
 *
 * @param {string} dateIso
 * @param {GameState} state
 * @returns {string}
 */
export function buildShareText(dateIso, state) {
  const n = puzzleNumber(dateIso);
  const total = state.guesses.length;
  const maxSquares = 5;
  const squares = [];

  for (let i = 0; i < maxSquares; i++) {
    const code = state.guesses[i];
    if (!code) {
      break;
    }
    const won = code === state.answer.code;
    squares.push(won ? '🟩' : '🟥');
  }

  while (squares.length < maxSquares && state.status === 'LOST') {
    squares.push('🟥');
  }

  const line1 = `Flag Guesser #${n} 🏳️ ${total}/${maxSquares}`;
  return `${line1}\n\n${squares.join('')}`;
}
