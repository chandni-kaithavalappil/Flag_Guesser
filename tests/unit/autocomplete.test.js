import { describe, it, expect } from 'vitest';
import { filterCountriesByQuery, normalizeName } from '../../src/game/countries.js';
import countries from '../../src/data/countries.json';

describe('normalizeName', () => {
  it('lowercases text for matching', () => {
    expect(normalizeName('France')).toBe('france');
  });

  it('strips diacritics', () => {
    expect(normalizeName("Côte d'Ivoire")).toBe('cote d ivoire');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeName('United  States')).toBe('united states');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeName('  france  ')).toBe('france');
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

  it('returns first 20 countries when query is empty', () => {
    const r = filterCountriesByQuery(countries, '');
    expect(r).toHaveLength(20);
  });

  it('returns empty array when query matches nothing', () => {
    const r = filterCountriesByQuery(countries, 'zzzzznonexistent');
    expect(r).toHaveLength(0);
  });

  it('matches when country has no aliases property', () => {
    const list = [{ code: 'TS', name: 'Test State' }]; // no aliases field
    const r = filterCountriesByQuery(list, 'test');
    expect(r).toHaveLength(1);
  });
});
