/**
 * @typedef {'WON' | 'LOST'} GameStatus
 */

/**
 * @typedef {Object} PersistenceRecord
 * @property {string} lastPlayed
 * @property {GameStatus} lastResult
 * @property {number} currentStreak
 * @property {number} longestStreak
 * @property {number} totalGames
 * @property {number} totalWins
 * @property {import('../game/engine.js').GameState | null} savedState
 */

const STORAGE_KEY = 'flagguesser_v1';

/**
 * @returns {PersistenceRecord}
 */
function defaultRecord() {
  return {
    lastPlayed: '',
    lastResult: 'LOST',
    currentStreak: 0,
    longestStreak: 0,
    totalGames: 0,
    totalWins: 0,
    savedState: null,
  };
}

/**
 * @param {string} isoA
 * @param {string} isoB
 * @returns {number} Signed day difference (a - b)
 */
function daysBetween(isoA, isoB) {
  const ord = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  };
  return ord(isoA) - ord(isoB);
}

/**
 * Loads persisted stats from localStorage.
 *
 * @returns {PersistenceRecord}
 */
export function loadRecord() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultRecord();
    }
    const parsed = JSON.parse(raw);
    return { ...defaultRecord(), ...parsed };
  } catch {
    return defaultRecord();
  }
}

/**
 * Persists the full record.
 *
 * @param {PersistenceRecord} record
 */
function persist(record) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

/**
 * Saves the outcome of a completed game and updates streaks.
 *
 * @param {string} dateIso - YYYY-MM-DD
 * @param {GameStatus} result
 */
export function saveResult(dateIso, result) {
  const prev = loadRecord();
  const next = { ...prev };

  next.totalGames = prev.totalGames + 1;
  next.lastPlayed = dateIso;
  next.lastResult = result;

  if (result === 'WON') {
    next.totalWins = prev.totalWins + 1;

    const prevDate = prev.lastPlayed;
    const consecutiveWin =
      prevDate && prev.lastResult === 'WON' && daysBetween(dateIso, prevDate) === 1;

    if (consecutiveWin) {
      next.currentStreak = prev.currentStreak + 1;
    } else {
      next.currentStreak = 1;
    }

    next.longestStreak = Math.max(prev.longestStreak, next.currentStreak);
  } else {
    next.currentStreak = 0;
  }

  next.savedState = null;
  persist(next);
}

/**
 * Saves mid-game state so it can be restored after a page reload.
 *
 * @param {import('../game/engine.js').GameState} gameState
 */
export function saveState(gameState) {
  try {
    const rec = loadRecord();
    rec.savedState = gameState;
    persist(rec);
  } catch {
    // ignore write failures (e.g. private browsing quota)
  }
}

/**
 * Returns the saved in-progress game state if it belongs to today, or null.
 *
 * @param {string} dateIso - YYYY-MM-DD
 * @returns {import('../game/engine.js').GameState | null}
 */
export function loadSavedState(dateIso) {
  const rec = loadRecord();
  if (rec.savedState && rec.savedState.date === dateIso) {
    return rec.savedState;
  }
  return null;
}

/**
 * Returns streak summary for display.
 *
 * @returns {{ currentStreak: number; longestStreak: number }}
 */
export function getStreakInfo() {
  const r = loadRecord();
  return { currentStreak: r.currentStreak, longestStreak: r.longestStreak };
}
