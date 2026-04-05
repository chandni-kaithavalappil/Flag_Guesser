import { describe, it, expect } from 'vitest';
import { getVisibleHints } from '../../src/game/hints.js';

const france = {
  continent: 'Europe',
  subregion: 'Western Europe',
  population: 67000000,
  capital: 'Paris',
};

describe('getVisibleHints', () => {
  it('returns empty array when 0 hints are visible', () => {
    expect(getVisibleHints(france, 0)).toHaveLength(0);
  });

  it('returns continent hint when 1 hint is visible', () => {
    const hints = getVisibleHints(france, 1);
    expect(hints[0].label).toBe('Continent');
    expect(hints[0].value).toBe('Europe');
  });

  it('returns all 4 hints when 4 hints are visible', () => {
    const hints = getVisibleHints(france, 4);
    expect(hints).toHaveLength(4);
  });

  it('includes capital in 4th hint', () => {
    const hints = getVisibleHints(france, 4);
    expect(hints[3].label).toBe('Capital');
    expect(hints[3].value).toBe('Paris');
  });

  it('formats population into human-readable tier', () => {
    const hints = getVisibleHints(france, 3);
    expect(hints[2].label).toBe('Population');
    expect(typeof hints[2].value).toBe('string');
    expect(hints[2].value).toMatch(/\d/);
  });
});
