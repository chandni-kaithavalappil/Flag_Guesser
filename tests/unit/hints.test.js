import { describe, it, expect } from 'vitest';
import { formatPopulationTier, getVisibleHints } from '../../src/game/hints.js';

const france = {
  continent: 'Europe',
  subregion: 'Western Europe',
  population: 67000000,
  capital: 'Paris',
};

describe('formatPopulationTier', () => {
  it('returns Very large for population >= 100M', () => {
    expect(formatPopulationTier(100_000_000)).toBe('Very large — over 100M');
    expect(formatPopulationTier(1_400_000_000)).toBe('Very large — over 100M');
  });

  it('returns Large for population >= 50M and < 100M', () => {
    expect(formatPopulationTier(67_000_000)).toBe('Large — over 50M');
    expect(formatPopulationTier(50_000_000)).toBe('Large — over 50M');
  });

  it('returns Medium-large for population >= 10M and < 50M', () => {
    expect(formatPopulationTier(10_000_000)).toBe('Medium-large — over 10M');
    expect(formatPopulationTier(30_000_000)).toBe('Medium-large — over 10M');
  });

  it('returns Medium for population >= 1M and < 10M', () => {
    expect(formatPopulationTier(1_000_000)).toBe('Medium — over 1M');
    expect(formatPopulationTier(5_000_000)).toBe('Medium — over 1M');
  });

  it('returns Small for population >= 100k and < 1M', () => {
    expect(formatPopulationTier(100_000)).toBe('Small — over 100k');
    expect(formatPopulationTier(500_000)).toBe('Small — over 100k');
  });

  it('returns Very small for population < 100k', () => {
    expect(formatPopulationTier(99_999)).toBe('Very small — under 100k');
    expect(formatPopulationTier(0)).toBe('Very small — under 100k');
  });
});

describe('getVisibleHints', () => {
  it('returns empty array when 0 hints are visible', () => {
    expect(getVisibleHints(france, 0)).toHaveLength(0);
  });

  it('returns continent hint when 1 hint is visible', () => {
    const hints = getVisibleHints(france, 1);
    expect(hints[0].label).toBe('Continent');
    expect(hints[0].value).toBe('Europe');
  });

  it('returns continent and subregion when 2 hints are visible', () => {
    const hints = getVisibleHints(france, 2);
    expect(hints).toHaveLength(2);
    expect(hints[1].label).toBe('Subregion');
    expect(hints[1].value).toBe('Western Europe');
  });

  it('returns 3 hints including population when 3 hints are visible', () => {
    const hints = getVisibleHints(france, 3);
    expect(hints).toHaveLength(3);
    expect(hints[2].label).toBe('Population');
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
