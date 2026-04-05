import { describe, it, expect } from 'vitest';
import { getDailyIndex, getDailyFlag } from '../../src/game/seed.js';
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
