import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadRecord,
  saveResult,
  saveState,
  loadSavedState,
  getStreakInfo,
} from '../../src/storage/persistence.js';

const mockStorage = {};

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k) => mockStorage[k] ?? null,
    setItem: (k, v) => {
      mockStorage[k] = v;
    },
    removeItem: (k) => {
      delete mockStorage[k];
    },
  });
  Object.keys(mockStorage).forEach((k) => {
    delete mockStorage[k];
  });
});

describe('loadRecord', () => {
  it('returns default record when no data exists', () => {
    const record = loadRecord();
    expect(record.currentStreak).toBe(0);
    expect(record.longestStreak).toBe(0);
    expect(record.totalGames).toBe(0);
  });

  it('returns default record when localStorage contains invalid JSON', () => {
    mockStorage['flagguesser_v1'] = '{bad json{{';
    const record = loadRecord();
    expect(record.currentStreak).toBe(0);
  });

  it('merges stored partial record with defaults', () => {
    mockStorage['flagguesser_v1'] = JSON.stringify({ totalGames: 3 });
    const record = loadRecord();
    expect(record.totalGames).toBe(3);
    expect(record.currentStreak).toBe(0);
  });
});

describe('saveResult', () => {
  it('increments totalGames on each save', () => {
    saveResult('2026-04-05', 'WON');
    saveResult('2026-04-06', 'LOST');
    const record = loadRecord();
    expect(record.totalGames).toBe(2);
  });

  it('increments currentStreak on consecutive wins', () => {
    saveResult('2026-04-05', 'WON');
    saveResult('2026-04-06', 'WON');
    const record = loadRecord();
    expect(record.currentStreak).toBe(2);
  });

  it('resets currentStreak to 0 after a loss', () => {
    saveResult('2026-04-05', 'WON');
    saveResult('2026-04-06', 'WON');
    saveResult('2026-04-07', 'LOST');
    const record = loadRecord();
    expect(record.currentStreak).toBe(0);
  });

  it('preserves longestStreak after a loss', () => {
    saveResult('2026-04-05', 'WON');
    saveResult('2026-04-06', 'WON');
    saveResult('2026-04-07', 'LOST');
    const record = loadRecord();
    expect(record.longestStreak).toBe(2);
  });

  it('starts a new streak at 1 after a gap in wins', () => {
    saveResult('2026-04-05', 'WON');
    saveResult('2026-04-07', 'WON'); // gap of 2 days
    const record = loadRecord();
    expect(record.currentStreak).toBe(1);
  });

  it('starts a new streak at 1 after first ever win', () => {
    saveResult('2026-04-05', 'WON');
    const record = loadRecord();
    expect(record.currentStreak).toBe(1);
  });

  it('updates longestStreak when current streak surpasses it', () => {
    saveResult('2026-04-05', 'WON');
    saveResult('2026-04-06', 'WON');
    saveResult('2026-04-07', 'WON');
    const record = loadRecord();
    expect(record.longestStreak).toBe(3);
  });
});

describe('saveState', () => {
  it('stores the game state so it can be retrieved', () => {
    const gameState = {
      date: '2026-04-05',
      guesses: ['DE'],
      status: 'PLAYING',
      hintsVisible: 1,
      answer: { code: 'FR', name: 'France' },
    };
    saveState(gameState);
    const rec = loadRecord();
    expect(rec.savedState).not.toBeNull();
    expect(rec.savedState.date).toBe('2026-04-05');
  });

  it('silently ignores localStorage write failures', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    });
    expect(() => saveState({ date: '2026-04-05' })).not.toThrow();
  });
});

describe('loadSavedState', () => {
  it('returns null when no saved state exists', () => {
    expect(loadSavedState('2026-04-05')).toBeNull();
  });

  it('returns null and does not throw when localStorage throws during read', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('storage unavailable');
      },
      setItem: () => {},
    });
    expect(loadSavedState('2026-04-05')).toBeNull();
  });

  it('returns the saved state when date matches', () => {
    const gameState = {
      date: '2026-04-05',
      guesses: [],
      status: 'PLAYING',
      hintsVisible: 0,
      answer: { code: 'FR', name: 'France' },
    };
    saveState(gameState);
    const result = loadSavedState('2026-04-05');
    expect(result).not.toBeNull();
    expect(result.date).toBe('2026-04-05');
  });

  it('returns null when saved state is for a different date', () => {
    const gameState = {
      date: '2026-04-04',
      guesses: [],
      status: 'PLAYING',
      hintsVisible: 0,
      answer: { code: 'FR', name: 'France' },
    };
    saveState(gameState);
    expect(loadSavedState('2026-04-05')).toBeNull();
  });
});

describe('getStreakInfo', () => {
  it('returns zero streaks when no games have been played', () => {
    const info = getStreakInfo();
    expect(info.currentStreak).toBe(0);
    expect(info.longestStreak).toBe(0);
  });

  it('reflects streak after wins', () => {
    saveResult('2026-04-05', 'WON');
    saveResult('2026-04-06', 'WON');
    const info = getStreakInfo();
    expect(info.currentStreak).toBe(2);
    expect(info.longestStreak).toBe(2);
  });
});
