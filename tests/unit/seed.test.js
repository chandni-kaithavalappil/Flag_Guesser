import { describe, it, expect } from 'vitest';
import { getDailyIndex, getDailyFlag, getSessionFlags } from '../../src/game/seed.js';
import countries from '../../src/data/countries.json';

describe('getDailyIndex', () => {
  it('returns the same index for the same date string', () => {
    const a = getDailyIndex('2026-04-05', countries.length);
    const b = getDailyIndex('2026-04-05', countries.length);
    expect(a).toBe(b);
  });

  it('returns different indices for different dates (high probability)', () => {
    const a = getDailyIndex('2026-04-05', countries.length);
    const b = getDailyIndex('2026-04-06', countries.length);
    expect(a).not.toBe(b);
  });

  it('returns an index within bounds', () => {
    const idx = getDailyIndex('2026-04-05', countries.length);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(countries.length);
  });

  it('returns 0 for len=1', () => {
    expect(getDailyIndex('2026-04-05', 1)).toBe(0);
  });
});

describe('getDailyFlag', () => {
  it('returns a valid Country object', () => {
    const country = getDailyFlag('2026-04-05');
    expect(country).toHaveProperty('code');
    expect(country).toHaveProperty('name');
    expect(country).toHaveProperty('continent');
    expect(country).toHaveProperty('flagUrl');
  });

  it('returns the same country for the same date', () => {
    const a = getDailyFlag('2026-04-05');
    const b = getDailyFlag('2026-04-05');
    expect(a.code).toBe(b.code);
  });
});

describe('getSessionFlags', () => {
  it('returns exactly count countries', () => {
    const flags = getSessionFlags('2026-04-05', 5);
    expect(flags).toHaveLength(5);
  });

  it('returns the same list for the same date', () => {
    const a = getSessionFlags('2026-04-05', 5);
    const b = getSessionFlags('2026-04-05', 5);
    expect(a.map((c) => c.code)).toEqual(b.map((c) => c.code));
  });

  it('returns a different list for a different date', () => {
    const a = getSessionFlags('2026-04-05', 5);
    const b = getSessionFlags('2026-04-06', 5);
    expect(a.map((c) => c.code)).not.toEqual(b.map((c) => c.code));
  });

  it('returns all valid Country objects', () => {
    const flags = getSessionFlags('2026-04-05', 5);
    for (const c of flags) {
      expect(c).toHaveProperty('code');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('flagUrl');
    }
  });

  it('returns distinct countries within a session', () => {
    const flags = getSessionFlags('2026-04-05', 10);
    const codes = flags.map((c) => c.code);
    expect(new Set(codes).size).toBe(10);
  });
});

describe('daily index cycle', () => {
  it('uses every country index exactly once in any 195 consecutive days', () => {
    const len = countries.length;
    const start = Date.UTC(2024, 0, 1);
    for (let offset = 0; offset < 400; offset += 1) {
      const seen = new Set();
      for (let i = 0; i < len; i += 1) {
        const t = start + (offset + i) * 86400000;
        const iso = new Date(t).toISOString().slice(0, 10);
        seen.add(getDailyIndex(iso, len));
      }
      expect(seen.size).toBe(len);
    }
  });
});
