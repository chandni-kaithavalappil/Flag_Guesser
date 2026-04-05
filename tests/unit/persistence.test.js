import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadRecord, saveResult } from '../../src/storage/persistence.js';

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
});
