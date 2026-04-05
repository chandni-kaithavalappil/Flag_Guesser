/**
 * @typedef {import('./seed.js').Country} Country
 */

/**
 * @typedef {'PLAYING' | 'WON' | 'LOST'} GameStatus
 */

/**
 * @typedef {Object} GameState
 * @property {Country}     answer
 * @property {string[]}    guesses
 * @property {GameStatus}  status
 * @property {number}      hintsVisible
 * @property {string}      date
 */

const BLUR_BY_WRONG = [20, 15, 10, 5, 2, 0];

/**
 * Creates initial game state for a daily puzzle.
 *
 * @param {Country} answer - Correct country
 * @param {string} date - ISO date YYYY-MM-DD
 * @returns {GameState}
 */
export function createGame(answer, date) {
  return {
    answer,
    guesses: [],
    status: 'PLAYING',
    hintsVisible: 0,
    date,
  };
}

/**
 * Submits a country code guess and returns the updated game state.
 *
 * @param {GameState} state - Current game state
 * @param {string} code - ISO 3166-1 alpha-2 country code
 * @returns {GameState} New game state after applying the guess
 */
export function submitGuess(state, code) {
  if (state.status !== 'PLAYING') {
    return state;
  }

  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return state;
  }

  const nextGuesses = [...state.guesses, normalized];

  if (normalized === state.answer.code) {
    return {
      ...state,
      guesses: nextGuesses,
      status: 'WON',
      hintsVisible: state.hintsVisible,
    };
  }

  const wrongAfter = nextGuesses.filter((c) => c !== state.answer.code).length;
  const nextHints = Math.min(wrongAfter, 4);

  if (wrongAfter >= 5) {
    return {
      ...state,
      guesses: nextGuesses,
      status: 'LOST',
      hintsVisible: nextHints,
    };
  }

  return {
    ...state,
    guesses: nextGuesses,
    hintsVisible: nextHints,
  };
}

/**
 * Returns CSS blur in pixels for the flag image.
 *
 * @param {number} wrongGuesses - Number of incorrect guesses so far
 * @param {GameStatus} [status] - When WON or LOST, blur is always 0
 * @returns {number}
 */
export function getBlurLevel(wrongGuesses, status) {
  if (status === 'WON' || status === 'LOST') {
    return 0;
  }
  const idx = Math.min(Math.max(wrongGuesses, 0), BLUR_BY_WRONG.length - 1);
  return BLUR_BY_WRONG[idx];
}
