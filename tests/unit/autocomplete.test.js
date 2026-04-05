import { describe, it, expect } from 'vitest';
import { filterCountriesByQuery, normalizeName } from '../../src/game/countries.js';
import countries from '../../src/data/countries.json';

describe('normalizeName', () => {
  it('lowercases text for matching', () => {
    expect(normalizeName('France')).toBe('france');
  });
});

describe('filterCountriesByQuery', () => {
  it('matches "fra" to France', () => {
    const r = filterCountriesByQuery(countries, 'fra');
    expect(r.some((c) => c.name === 'France')).toBe(true);
  });

  it('matches "united" to multiple countries', () => {
    const r = filterCountriesByQuery(countries, 'united');
    const names = r.map((c) => c.name);
    expect(names.some((n) => n.includes('United States'))).toBe(true);
    expect(names.some((n) => n.includes('United Kingdom'))).toBe(true);
    expect(names.some((n) => n.includes('United Arab Emirates'))).toBe(true);
  });

  it('is case-insensitive', () => {
    const r = filterCountriesByQuery(countries, 'france');
    expect(r.some((c) => c.name === 'France')).toBe(true);
  });
});
